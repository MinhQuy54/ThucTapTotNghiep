from django.urls import path
from .views import *

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("oauth/google/success/", google_oauth_success),
    path("register/", RegisterView.as_view()),
    path("activate/<str:token>/", ActivateAccountView.as_view()),
    path('reset-password/', RequestResetPasswordView.as_view()),
    path('reset-password-confirm/', ResetPasswordView.as_view()),
    path('user/', UserList.as_view()),
    path('user/update/', UserDetail.as_view()),
    path('address/', ShippingAddressList.as_view()),
    path('address/<int:pk>/', ShippingAddressDetail.as_view()),
    path('order/', OrderList.as_view()),
    path('order/detail/<int:pk>/', OrderDetailView.as_view()),
    path('order/detail/cancel/<int:pk>/', OrderDetailView.as_view()),
    path('contact/', ContactList.as_view()),
    path('notification/read/<int:pk>/', MarkNotificationAsRead.as_view()),
    path('ghn/provinces/', GetProvincesView.as_view()),
    path('ghn/districts/', GetDistrictsView.as_view()),
    path('ghn/wards/', GetWardsView.as_view()),
    path('v2/reviews/<int:product_id>/', ReviewListView.as_view()),
    path('notification/', NotificationList.as_view()),
    path('notification/<int:pk>/', NotificationDetail.as_view())
]
