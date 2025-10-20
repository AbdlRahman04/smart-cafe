from django.db import models

# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name

class Item(models.Model):
    category = models.ForeignKey(Category, related_name="items", on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price_minor = models.PositiveIntegerField(help_text="Price in minor units (e.g., fils/cents)")
    is_active = models.BooleanField(default=True)
    image_url = models.URLField(blank=True)

    class Meta:
        ordering = ["category__sort_order", "name"]

    def __str__(self):
        return f"{self.name} ({self.price_minor})"