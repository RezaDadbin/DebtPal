# api/admin.py
from django.contrib import admin
from .models import (
    User,
    ListItem,
    UserAccounting,
    DebtItem,
    Payer,
    InvolvedPerson
)

# Register your models here to make them visible in the admin panel.
admin.site.register(User)
admin.site.register(ListItem)
admin.site.register(UserAccounting)
admin.site.register(DebtItem)
admin.site.register(Payer)
admin.site.register(InvolvedPerson)