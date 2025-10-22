from rest_framework import serializers
from .models import Wallet, WalletTx

class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ["balance_minor"]

class TopupSerializer(serializers.Serializer):
    amount_minor = serializers.IntegerField(min_value=1)
