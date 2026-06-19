from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.generic import TemplateView
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DebtItem, InvolvedPerson, Payer, UserAccounting
from .serializers import (
    AddDebtSerializer,
    ChangePasswordSerializer,
    DeleteAccountSerializer,
    DebtItemSerializer,
    RegisterSerializer,
    UserAccountingDetailSerializer,
    UserAccountingSerializer,
    UserSerializer,
)
from .utils import settle_debts_for_accounting


@method_decorator(csrf_protect, name="dispatch")
class RegisterAPIView(generics.GenericAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        authenticated_user = authenticate(
            username=user.email,
            password=serializer.validated_data["password"],
        )
        if authenticated_user is not None:
            login(request, authenticated_user)

        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "message": "User created and logged in successfully.",
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_protect, name="dispatch")
class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        password = request.data.get("password")
        if not email or not password:
            return Response(
                {"message": "Please provide both email and password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=email, password=password)
        if user is None:
            return Response(
                {"message": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        login(request, user)
        return Response({
            "message": "Login successful!",
            "user": UserSerializer(user).data,
        })


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        logout(request)
        return Response({"message": "Logout successful."})


class UserStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response({"hasAccountings": request.user.accountings.exists()})


class AddDebtAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = AddDebtSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        debt_item_data = data["debtItem"]

        with transaction.atomic():
            accounting, _ = UserAccounting.objects.get_or_create(
                user=request.user,
                name=data["accountingName"],
            )
            debt_item = DebtItem.objects.create(
                user_accounting=accounting,
                name=debt_item_data["name"],
                price=debt_item_data["price"],
                comment=debt_item_data.get("comment") or "",
                date=debt_item_data["date"],
            )
            Payer.objects.bulk_create([
                Payer(
                    debt_item=debt_item,
                    name=payer["name"],
                    paid_amount=payer["amount"],
                )
                for payer in debt_item_data["payers"]
            ])
            InvolvedPerson.objects.bulk_create([
                InvolvedPerson(debt_item=debt_item, name=name)
                for name in debt_item_data["involvedPersons"]
            ])

        saved_debt = DebtItem.objects.prefetch_related("payers", "involved_persons").get(pk=debt_item.pk)
        return Response({
            "message": f"Debt item '{saved_debt.name}' added successfully!",
            "userAccountingId": accounting.id,
            "savedDebt": DebtItemSerializer(saved_debt).data,
        }, status=status.HTTP_201_CREATED)


class SettleDebtsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        accounting = get_object_or_404(UserAccounting, pk=pk, user=request.user)
        payments, balances = settle_debts_for_accounting(accounting)
        return Response({
            "accounting_name": accounting.name,
            "settlement_plan": payments,
            "final_balances": balances,
        })


class UserAccountingListAPIView(generics.ListAPIView):
    serializer_class = UserAccountingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserAccounting.objects.filter(user=self.request.user).order_by("-created_at")


class UserAccountingDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserAccountingDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserAccounting.objects.filter(user=self.request.user)


class ChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["newPassword"])
        request.user.save(update_fields=["password"])
        update_session_auth_hash(request, request.user)
        return Response({"message": "Password changed successfully."})


class DeleteAccountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        serializer = DeleteAccountSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        logout(request)
        user.delete()
        return Response({"message": "Account deleted successfully."})


@method_decorator(ensure_csrf_cookie, name="dispatch")
class LoginView(TemplateView):
    template_name = "api/login.html"


@method_decorator(ensure_csrf_cookie, name="dispatch")
class SignupView(TemplateView):
    template_name = "api/signup.html"


@method_decorator(ensure_csrf_cookie, name="dispatch")
class WelcomeView(LoginRequiredMixin, TemplateView):
    template_name = "api/welcome.html"


@method_decorator(ensure_csrf_cookie, name="dispatch")
class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "api/main.html"


@method_decorator(ensure_csrf_cookie, name="dispatch")
class SettingsView(LoginRequiredMixin, TemplateView):
    template_name = "api/setting.html"


@method_decorator(ensure_csrf_cookie, name="dispatch")
class TransactionsView(LoginRequiredMixin, TemplateView):
    template_name = "api/transactions.html"
