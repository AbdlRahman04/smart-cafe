from django.urls import path
from .views import CategoryListView, ItemListView, ItemDetailView

urlpatterns = [
    # will add endpoints later
        path("categories/", CategoryListView.as_view(), name="catalog-categories"),
    path("items/", ItemListView.as_view(), name="catalog-items"),
    path("items/<int:pk>/", ItemDetailView.as_view(), name="catalog-item-detail"),

]
