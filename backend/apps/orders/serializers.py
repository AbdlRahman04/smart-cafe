from rest_framework import serializers
from apps.catalog.models import Item
from apps.catalog.serializers import ItemSerializer
from .models import Cart, CartItem


class CartItemWriteSerializer(serializers.ModelSerializer):
    item_id = serializers.PrimaryKeyRelatedField(
        source="item", queryset=Item.objects.filter(is_active=True), write_only=True
    )

    class Meta:
        model = CartItem
        fields = ["id", "item_id", "qty"]

    def validate_qty(self, v):
        if v < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return v


class CartItemReadSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    line_total_minor = serializers.IntegerField(read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "item", "qty", "line_total_minor"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemReadSerializer(many=True, read_only=True)
    total_minor = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "total_minor", "updated_at"]
