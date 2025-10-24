"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def root(_request):
    return JsonResponse({
        "service": "smart-cafe API",
        "links": {
            "health": "/api/healthz",
            "accounts": "/api/accounts/",
            "catalog": "/api/catalog/",
            "orders": "/api/orders/",
            "wallet": "/api/wallet/",
            "payments": "/api/payments/",
        }
    })

def healthz(_request):
    return JsonResponse({"status": "ok"})

urlpatterns = [
    path("", root),                                          # <— adds a root response
    path("admin/", admin.site.urls),                         # Django Admin (back-office)
    path("api/healthz", healthz),
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/catalog/", include("apps.catalog.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/wallet/", include("apps.wallet.urls")),
    path("api/payments/", include("apps.payments.urls")),
]
