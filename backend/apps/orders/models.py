from django.conf import settings
from django.db import models
from django.utils import timezone
from apps.catalog.models import Item


# ---- CART ----
class Cart(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="carts")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["user", "updated_at"])]

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

# ---- ORDER ----
class Order(models.Model):
    PENDING = "pending"
    PAID = "paid"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

    STATUSES = [
        (PENDING, "Pending"),
        (PAID, "Paid"),
        (PREPARING, "Preparing"),
        (READY, "Ready"),
        (COMPLETED, "Completed"),
        (CANCELLED, "Cancelled"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    status = models.CharField(max_length=12, choices=STATUSES, default=PENDING)
    total_minor = models.PositiveIntegerField(default=0)
    paid_minor = models.PositiveIntegerField(default=0)
    pickup_time = models.DateTimeField()  # MVP: exact timestamp
    service_day = models.DateField()      # denormalized "Dubai day" for quotas
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["user", "service_day", "status", "created_at"])]

    def __str__(self):
        return f"Order<{self.id}> {self.status} user={self.user_id}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    item_name = models.CharField(max_length=200)
    unit_price_minor = models.PositiveIntegerField()
    qty = models.PositiveIntegerField(default=1)
    line_total_minor = models.PositiveIntegerField()

    def __str__(self):
        return f"OrderItem order={self.order_id} {self.item_name} x {self.qty}"


# ---- DAILY QUOTA (5/day) ----
class OrderQuota(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    service_day = models.DateField()  # Dubai day
    paid_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = (("user", "service_day"),)