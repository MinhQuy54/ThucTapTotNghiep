from django.urls import path
from .views import *

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("register/", RegisterView.as_view()),
    path('reset-password/', RequestResetPasswordView.as_view()),
    path('reset-password-confirm/', ResetPasswordView.as_view()),
]