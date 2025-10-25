# apps/catalog/views.py
from rest_framework import generics, viewsets
from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import Category, Item
from .serializers import CategorySerializer, ItemSerializer


# ---------- Public, read-only endpoints ----------
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True).order_by("sort_order", "name")
    serializer_class = CategorySerializer


class ItemListView(generics.ListAPIView):
    serializer_class = ItemSerializer

    def get_queryset(self):
        qs = Item.objects.filter(is_active=True)
        category_id = self.request.query_params.get("category_id")
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs


class ItemDetailView(generics.RetrieveAPIView):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer


# ---------- Permission ----------
class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


# ---------- Admin CRUD endpoints ----------
class CategoryAdminViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("sort_order", "name")
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]


class ItemAdminViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.select_related("category").order_by("category__sort_order", "name")
    serializer_class = ItemSerializer
    permission_classes = [IsAdminOrReadOnly]
