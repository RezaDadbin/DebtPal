# api/signals.py
from django.db.models import Sum
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import ListItem, User

@receiver([post_save, post_delete], sender=ListItem)
def update_user_list_item_totals(sender, instance, **kwargs):
    """
    Listens for any ListItem being saved or deleted and updates the
    to_get_amount and to_pay_amount fields on the related User model.
    """
    user = instance.user

    # Calculate total 'to get' amount
    to_get_total = ListItem.objects.filter(
        user=user, item_type=ListItem.ItemType.GET
    ).aggregate(total=Sum('amount'))['total'] or 0.00

    # Calculate total 'to pay' amount
    to_pay_total = ListItem.objects.filter(
        user=user, item_type=ListItem.ItemType.PAY
    ).aggregate(total=Sum('amount'))['total'] or 0.00

    # Update the user object without triggering signals again
    User.objects.filter(pk=user.pk).update(
        to_get_amount=to_get_total,
        to_pay_amount=to_pay_total
    )