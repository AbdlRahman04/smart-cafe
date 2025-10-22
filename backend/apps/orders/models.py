from django.conf import settings
from django.db import models
from apps.catalog.models import Item


class Cart(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="carts")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "updated_at"]),
        ]

    @property
    def total_minor(self) -> int:
        return sum(ci.line_total_minor for ci in self.items.select_related("item"))

    def __str__(self):
        return f"Cart<{self.id}> user={self.user_id}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    qty = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = (("cart", "item"),)

    @property
    def line_total_minor(self) -> int:
        return self.qty * self.item.price_minor

    def __str__(self):
        return f"CartItem cart={self.cart_id} item={self.item_id} qty={self.qty}"
