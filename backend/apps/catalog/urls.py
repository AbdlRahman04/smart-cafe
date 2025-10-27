from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryListView, ItemListView, ItemDetailView, CategoryAdminViewSet, ItemAdminViewSet

router = DefaultRouter()
router.register(r'admin/categories', CategoryAdminViewSet, basename='admin-categories')
router.register(r'admin/items', ItemAdminViewSet, basename='admin-items')

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="catalog-categories"),
    path("items/", ItemListView.as_view(), name="catalog-items"),
    path("items/<int:pk>/", ItemDetailView.as_view(), name="catalog-item-detail"),
        path("", include(router.urls)),

]
