from django.conf import settings
from django.db import models


class Wallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wallet")
    balance_minor = models.PositiveIntegerField(default=0)  # e.g., fils

    def __str__(self):
        return f"Wallet<{self.user_id}> balance={self.balance_minor}"


class WalletTx(models.Model):
    TOPUP = "TOPUP"
    DEBIT = "DEBIT"
    REFUND = "REFUND"
    TYPES = [(TOPUP, "Topup"), (DEBIT, "Debit"), (REFUND, "Refund")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wallet_txs")
    type = models.CharField(max_length=10, choices=TYPES)
    amount_minor = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    ref = models.CharField(max_length=64, blank=True)  # optional external ref

    class Meta:
        indexes = [models.Index(fields=["user", "created_at"])]

    def __str__(self):
        return f"{self.type} {self.amount_minor} to user={self.user_id}"
