from django.db import transaction
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from django.utils import timezone

from apps.wallet.models import Wallet, WalletTx
from .models import Cart, CartItem, Order, OrderItem, OrderQuota
from .serializers import OrderSerializer



from .serializers import (
    CartSerializer,
    CartItemWriteSerializer,
    CartItemReadSerializer,
)


def _get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart

class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart = _get_or_create_cart(request.user)
        data = CartSerializer(cart).data
        return Response(data)

    def delete(self, request):
        """Clear the cart."""
        cart = _get_or_create_cart(request.user)
        cart.items.all().delete()
        cart.refresh_from_db()
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class CartItemsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        """
        Add an item to the cart (or increase qty if it already exists).
        Body: { "item_id": <int>, "qty": <int> }
        """
        cart = _get_or_create_cart(request.user)
        serializer = CartItemWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.validated_data["item"]
        qty = serializer.validated_data["qty"]

        ci, created = CartItem.objects.select_for_update().get_or_create(cart=cart, item=item, defaults={"qty": qty})
        if not created:
            ci.qty += qty
            ci.save(update_fields=["qty"])

        return Response(CartItemReadSerializer(ci).data, status=status.HTTP_201_CREATED)


class CartItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_obj(self, request, pk):
        cart = _get_or_create_cart(request.user)
        return cart.items.select_related("item").get(pk=pk)

    @transaction.atomic
    def patch(self, request, pk: int):
        """Update quantity of a cart item. Body: { "qty": <int> }"""
        ci = self._get_obj(request, pk)
        qty = int(request.data.get("qty", 0))
        if qty < 1:
            return Response({"detail": "Quantity must be at least 1."}, status=status.HTTP_400_BAD_REQUEST)
        ci.qty = qty
        ci.save(update_fields=["qty"])
        return Response(CartItemReadSerializer(ci).data)

    @transaction.atomic
    def delete(self, request, pk: int):
        ci = self._get_obj(request, pk)
        ci.delete()
        # return the new cart snapshot
        cart = _get_or_create_cart(request.user)
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

def _dubai_service_day(dt):
    # if TIME_ZONE is Asia/Dubai and USE_TZ True, dt.astimezone picks it up
    return dt.astimezone(timezone.get_current_timezone()).date()


class CheckoutView(APIView):
    """
    POST /api/orders/checkout/
    Body: { "pickup_time": "2025-10-25T12:30:00" }
    Steps:
      - snapshot cart into an Order + OrderItems
      - enforce 5 paid orders/day
      - debit wallet (wallet-first MVP)
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        pickup_time_str = request.data.get("pickup_time")
        if not pickup_time_str:
            return Response({"detail": "pickup_time is required (ISO8601)."},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            pickup_time = timezone.datetime.fromisoformat(pickup_time_str)
            if timezone.is_naive(pickup_time):
                pickup_time = timezone.make_aware(pickup_time, timezone.get_current_timezone())
        except Exception:
            return Response({"detail": "Invalid pickup_time format."}, status=status.HTTP_400_BAD_REQUEST)

        # get cart and compute totals
        cart, _ = Cart.objects.get_or_create(user=request.user)
        items = list(cart.items.select_related("item"))
        if not items:
            return Response({"detail": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        total_minor = sum(ci.line_total_minor for ci in items)

        # quota check (5/day)
        now = timezone.now()
        service_day = _dubai_service_day(now)
        quota, _ = OrderQuota.objects.select_for_update().get_or_create(user=request.user, service_day=service_day)
        if quota.paid_count >= 5:
            return Response({"ok": False, "code": "ORDER_LIMIT_REACHED",
                             "message": "You reached today’s limit (5)."}, status=429)

        # wallet-first debit
        wallet, _ = Wallet.objects.select_for_update().get_or_create(user=request.user)
        to_debit = min(wallet.balance_minor, total_minor)
        wallet.balance_minor -= to_debit
        wallet.save(update_fields=["balance_minor"])
        if to_debit > 0:
            WalletTx.objects.create(user=request.user, type=WalletTx.DEBIT, amount_minor=to_debit, ref="checkout")

        paid_minor = to_debit
        if paid_minor < total_minor:
            # For MVP we require full wallet cover; later we’ll add card for the remainder.
            return Response({"ok": False, "code": "INSUFFICIENT_WALLET_FUNDS",
                             "message": "Not enough wallet balance for this order."},
                            status=status.HTTP_402_PAYMENT_REQUIRED)

        # create order + items snapshot
        order = Order.objects.create(
            user=request.user,
            status=Order.PAID,
            total_minor=total_minor,
            paid_minor=paid_minor,
            pickup_time=pickup_time,
            service_day=service_day,
        )
        OrderItem.objects.bulk_create([
            OrderItem(
                order=order,
                item_name=ci.item.name,
                unit_price_minor=ci.item.price_minor,
                qty=ci.qty,
                line_total_minor=ci.line_total_minor,
            ) for ci in items
        ])

        # increment paid quota
        quota.paid_count += 1
        quota.save(update_fields=["paid_count"])

        # clear cart
        cart.items.all().delete()

        return Response({"ok": True, "message": "Order paid.",
                         "data": OrderSerializer(order).data}, status=status.HTTP_201_CREATED)