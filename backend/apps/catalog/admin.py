from django.contrib import admin
from .models import Category, Item


# Register your models here.

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "sort_order")
    ordering = ("sort_order", "name")

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price_minor", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name",)