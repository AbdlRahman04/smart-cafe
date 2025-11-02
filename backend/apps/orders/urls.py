from django.urls import path
from .views import (
    CartView, CartItemsView, CartItemDetailView,
    CheckoutView, MyOrdersView,
    AdminDashboardView, AdminOrdersView, AdminOrderUpdateView,
)

urlpatterns = [
    # will add endpoints later
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/items/", CartItemsView.as_view(), name="cart-items"),
    path("cart/items/<int:pk>/", CartItemDetailView.as_view(), name="cart-item-detail"),
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("orders/", MyOrdersView.as_view(), name="my-orders"),
    
    # Admin endpoints
    path("admin/dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
    path("admin/orders/", AdminOrdersView.as_view(), name="admin-orders"),
    path("admin/orders/<int:pk>/", AdminOrderUpdateView.as_view(), name="admin-order-update"),
]
