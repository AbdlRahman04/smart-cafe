from django.db import transaction
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem
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
