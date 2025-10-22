from django.urls import path
from .views import WalletView, TopupView

urlpatterns = [
    # will add endpoints later
    path("", WalletView.as_view(), name="wallet"),
    path("topup/", TopupView.as_view(), name="wallet-topup"),
]
