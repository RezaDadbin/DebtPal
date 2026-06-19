# api/models.py
from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser

# --- USER MODEL (from before) ---

def capitalize_username(username):
    if not username:
        return ''
    return "".join(word.capitalize() for word in username.strip().split())

class User(AbstractUser):
    to_get_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    to_pay_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def save(self, *args, **kwargs):
        self.username = capitalize_username(self.username)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username

# --- NEW MODELS ---

class ListItem(models.Model):
    class ItemType(models.TextChoices):
        GET = 'GET', 'To Get'
        PAY = 'PAY', 'To Pay'
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='list_items')
    person_name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    item_type = models.CharField(max_length=3, choices=ItemType.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.person_name} - {self.get_item_type_display()}: {self.amount}'

class UserAccounting(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='accountings')
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class DebtItem(models.Model):
    user_accounting = models.ForeignKey(UserAccounting, on_delete=models.CASCADE, related_name='debt_items')
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    comment = models.TextField(blank=True, null=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Payer(models.Model):
    debt_item = models.ForeignKey(DebtItem, on_delete=models.CASCADE, related_name='payers')
    name = models.CharField(max_length=255)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.name} paid {self.paid_amount}'

class InvolvedPerson(models.Model):
    debt_item = models.ForeignKey(DebtItem, on_delete=models.CASCADE, related_name='involved_persons')
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name