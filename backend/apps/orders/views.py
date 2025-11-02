from django.db import transaction
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta, datetime

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.wallet.models import Wallet, WalletTx
from .models import Cart, CartItem, Order, OrderItem, OrderQuota
from .serializers import (
    OrderSerializer,
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
            # Parse ISO8601 format using standard datetime.fromisoformat
            # This handles formats like "2025-10-25T12:30:00" (naive) or "2025-10-25T12:30:00Z" (aware)
            pickup_time = datetime.fromisoformat(pickup_time_str.replace('Z', '+00:00'))
            if timezone.is_naive(pickup_time):
                pickup_time = timezone.make_aware(pickup_time, timezone.get_current_timezone())
        except (ValueError, AttributeError, TypeError) as e:
            return Response({"detail": f"Invalid pickup_time format: {str(e)}. Expected ISO8601 format like '2025-10-25T12:30:00'."}, 
                          status=status.HTTP_400_BAD_REQUEST)

        # get cart and compute totals
        cart, _ = Cart.objects.get_or_create(user=request.user)
        items = list(cart.items.select_related("item"))
        if not items:
            return Response({"detail": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        total_minor = sum(ci.line_total_minor for ci in items)

        # quota check (5/day) - skip for admin users
        now = timezone.now()
        service_day = _dubai_service_day(now)
        is_admin = request.user.is_staff or request.user.is_superuser
        
        if not is_admin:
            quota, _ = OrderQuota.objects.select_for_update().get_or_create(user=request.user, service_day=service_day)
            if quota.paid_count >= 5:
                return Response({"ok": False, "code": "ORDER_LIMIT_REACHED",
                                 "message": "You reached today's limit (5)."}, status=429)

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

        # increment paid quota - skip for admin users
        if not is_admin:
            quota.paid_count += 1
            quota.save(update_fields=["paid_count"])

        # clear cart
        cart.items.all().delete()

        return Response({"ok": True, "message": "Order paid.",
                         "data": OrderSerializer(order).data}, status=status.HTTP_201_CREATED)
        
class MyOrdersView(generics.ListAPIView):
    """Return the authenticated user's orders, newest first."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by("-created_at")


class IsAdminUser(permissions.BasePermission):
    """Permission check for admin or superuser only."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser))


class AdminDashboardView(APIView):
    """Dashboard statistics for admin users."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        today = now.date()
        today_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))
        week_ago = today - timedelta(days=7)

        # Total orders
        total_orders = Order.objects.count()
        orders_today = Order.objects.filter(created_at__gte=today_start).count()

        # Total revenue
        total_revenue_minor = Order.objects.aggregate(
            total=Sum('total_minor')
        )['total'] or 0
        revenue_today_minor = Order.objects.filter(
            created_at__gte=today_start
        ).aggregate(total=Sum('total_minor'))['total'] or 0

        # Active orders (pending, paid, preparing)
        active_orders = Order.objects.filter(
            status__in=[Order.PENDING, Order.PAID, Order.PREPARING]
        ).count()

        # Average order value
        avg_order_minor = Order.objects.aggregate(
            avg=Avg('total_minor')
        )['avg'] or 0

        # Last 7 days revenue (for chart)
        daily_revenue = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_start = timezone.make_aware(datetime.combine(day, datetime.min.time()))
            day_end = day_start + timedelta(days=1)
            revenue = Order.objects.filter(
                created_at__gte=day_start,
                created_at__lt=day_end
            ).aggregate(total=Sum('total_minor'))['total'] or 0
            daily_revenue.append({
                'date': day.isoformat(),
                'day_name': day.strftime('%a'),
                'revenue_minor': revenue
            })

        # Recent orders (last 10)
        recent_orders = Order.objects.select_related('user').order_by('-created_at')[:10]
        recent_orders_data = []
        for order in recent_orders:
            items_list = list(order.items.values_list('item_name', 'qty'))
            items_str = ', '.join([f"{qty}x {name}" for name, qty in items_list])
            recent_orders_data.append({
                'id': str(order.id)[:8],
                'full_id': order.id,
                'student': order.user.username,
                'items': items_str,
                'amount_minor': order.total_minor,
                'pickup_time': order.pickup_time.strftime('%I:%M %p') if order.pickup_time else '',
                'status': order.status,
                'created_at': order.created_at.isoformat()
            })

        return Response({
            'total_orders': total_orders,
            'orders_today': orders_today,
            'total_revenue_minor': total_revenue_minor,
            'revenue_today_minor': revenue_today_minor,
            'active_orders': active_orders,
            'avg_order_minor': int(avg_order_minor),
            'daily_revenue': daily_revenue,
            'recent_orders': recent_orders_data
        })


class AdminOrdersView(generics.ListAPIView):
    """List all orders (admin only)."""
    permission_classes = [IsAdminUser]
    serializer_class = OrderSerializer

    def get_queryset(self):
        queryset = Order.objects.select_related('user').order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class AdminOrderUpdateView(APIView):
    """Update order status (admin only)."""
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        order = Order.objects.get(pk=pk)
        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUSES):
            return Response(
                {"detail": "Invalid status."},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = new_status
        order.save(update_fields=['status'])
        return Response(OrderSerializer(order).data)
