from django.db import transaction
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Wallet, WalletTx
from .serializers import WalletSerializer, TopupSerializer


def _get_or_create_wallet(user):
    wallet, _ = Wallet.objects.get_or_create(user=user)
    return wallet


class WalletView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wallet = _get_or_create_wallet(request.user)
        return Response(WalletSerializer(wallet).data)


class TopupView(APIView):
    """
    MVP mock top-up (no real gateway):
    Body: { "amount_minor": 5000 }
    """
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        s = TopupSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        amount = s.validated_data["amount_minor"]
        wallet = _get_or_create_wallet(request.user)

        wallet.balance_minor += amount
        wallet.save(update_fields=["balance_minor"])
        WalletTx.objects.create(user=request.user, type=WalletTx.TOPUP, amount_minor=amount, ref="mock-topup")

        return Response({"ok": True, "message": "Wallet topped up", "data": WalletSerializer(wallet).data},
                        status=status.HTTP_200_OK)
