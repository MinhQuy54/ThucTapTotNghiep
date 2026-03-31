from django.urls import path
from .views import *

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("register/", RegisterView.as_view()),
    path("activate/<str:token>/", ActivateAccountView.as_view()),
    path('reset-password/', RequestResetPasswordView.as_view()),
    path('reset-password-confirm/', ResetPasswordView.as_view()),
    path('user/', UserList.as_view()),
    path('user/update/', UserDetail.as_view()),
    path('address/', ShippingAddressList.as_view()),
    path('address/<int:pk>/', ShippingAddressDetail.as_view()),
]