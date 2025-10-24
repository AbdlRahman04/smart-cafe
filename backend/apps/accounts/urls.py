from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from .views import MeView, RegisterView, LogoutView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", obtain_auth_token, name="login"),  # returns {"token": "..."}
    path("me/", MeView.as_view(), name="me"),
    path("logout/", LogoutView.as_view(), name="logout"),
]

