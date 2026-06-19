from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

from api import views as api_views


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("health/", health_check, name="health-check"),
    path("", api_views.LoginView.as_view(), name="login-page"),
    path("signup/", api_views.SignupView.as_view(), name="signup-page"),
    path("welcome/", api_views.WelcomeView.as_view(), name="welcome-page"),
    path("dashboard/", api_views.DashboardView.as_view(), name="dashboard-page"),
    path("settings/", api_views.SettingsView.as_view(), name="settings-page"),
    path("transactions/", api_views.TransactionsView.as_view(), name="transactions-page"),
]
