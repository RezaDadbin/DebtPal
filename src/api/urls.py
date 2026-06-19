from django.urls import path

from . import views

urlpatterns = [
    path("auth/signup/", views.RegisterAPIView.as_view(), name="signup"),
    path("auth/login/", views.LoginAPIView.as_view(), name="login"),
    path("auth/logout/", views.LogoutAPIView.as_view(), name="logout"),
    path("user/initial-status/", views.UserStatusAPIView.as_view(), name="user-status"),
    path("user/change-password/", views.ChangePasswordAPIView.as_view(), name="change-password"),
    path("user/account/", views.DeleteAccountAPIView.as_view(), name="delete-account"),
    path("accountings/", views.UserAccountingListAPIView.as_view(), name="accounting-list"),
    path("accountings/add-debt/", views.AddDebtAPIView.as_view(), name="add-debt"),
    path("accountings/<int:pk>/settle/", views.SettleDebtsAPIView.as_view(), name="settle-debts"),
    path("accountings/<int:pk>/", views.UserAccountingDetailAPIView.as_view(), name="accounting-detail"),
]
