from decimal import Decimal

from django.contrib.auth import password_validation
from rest_framework import serializers

from .models import User, Payer, InvolvedPerson, DebtItem, UserAccounting


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "to_get_amount", "to_pay_amount"]


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )


class PayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payer
        fields = ["id", "name", "paid_amount"]


class InvolvedPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvolvedPerson
        fields = ["id", "name"]


class DebtItemSerializer(serializers.ModelSerializer):
    payers = PayerSerializer(many=True, read_only=True)
    involved_persons = InvolvedPersonSerializer(many=True, read_only=True)

    class Meta:
        model = DebtItem
        fields = [
            "id", "name", "price", "comment", "date", "created_at",
            "user_accounting", "payers", "involved_persons"
        ]


class UserAccountingSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccounting
        fields = ["id", "name", "created_at"]


class UserAccountingDetailSerializer(serializers.ModelSerializer):
    debt_items = DebtItemSerializer(many=True, read_only=True)

    class Meta:
        model = UserAccounting
        fields = ["id", "name", "created_at", "debt_items"]


class AddDebtPayerSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.01"))


class AddDebtItemInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal("0.01"))
    comment = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    date = serializers.DateField()
    payers = AddDebtPayerSerializer(many=True, allow_empty=False)
    involvedPersons = serializers.ListField(
        child=serializers.CharField(max_length=255),
        allow_empty=False,
    )

    def validate_involvedPersons(self, value):
        names = [name.strip() for name in value if name.strip()]
        if not names:
            raise serializers.ValidationError("At least one involved person is required.")
        return names

    def validate(self, attrs):
        payer_total = sum((payer["amount"] for payer in attrs["payers"]), Decimal("0.00"))
        if payer_total != attrs["price"]:
            raise serializers.ValidationError(
                "The sum of payer amounts must match the debt item price."
            )
        return attrs


class AddDebtSerializer(serializers.Serializer):
    accountingName = serializers.CharField(max_length=255)
    debtItem = AddDebtItemInputSerializer()


class ChangePasswordSerializer(serializers.Serializer):
    currentPassword = serializers.CharField(write_only=True)
    newPassword = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["currentPassword"]):
            raise serializers.ValidationError({"currentPassword": "Current password is incorrect."})
        if attrs["currentPassword"] == attrs["newPassword"]:
            raise serializers.ValidationError({"newPassword": "New password must be different."})
        password_validation.validate_password(attrs["newPassword"], user=user)
        return attrs


class DeleteAccountSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Password is incorrect.")
        return value
