import json
from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import Client, TestCase

from .models import DebtItem, InvolvedPerson, Payer, UserAccounting


class DebtPalSmokeTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="Reza",
            email="reza@example.com",
            password="password123",
        )

    def test_public_pages_render(self):
        self.assertEqual(self.client.get("/").status_code, 200)
        self.assertEqual(self.client.get("/signup/").status_code, 200)

    def test_dashboard_requires_login(self):
        response = self.client.get("/dashboard/")
        self.assertEqual(response.status_code, 302)
        self.assertIn("/?next=/dashboard/", response["Location"])

    def test_add_debt_api_creates_accounting_form_data(self):
        self.client.force_login(self.user)

        payload = {
            "accountingName": "Tehran Trip",
            "debtItem": {
                "name": "Hotel Booking",
                "price": 180,
                "comment": "Two nights near Vanak Square.",
                "date": "2026-06-10",
                "payers": [{"name": "Reza", "amount": 180}],
                "involvedPersons": ["Reza", "Sina", "Sara"],
            },
        }

        response = self.client.post(
            "/api/accountings/add-debt/",
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        accounting = UserAccounting.objects.get(user=self.user, name="Tehran Trip")
        debt = DebtItem.objects.get(user_accounting=accounting, name="Hotel Booking")

        self.assertEqual(debt.price, Decimal("180.00"))
        self.assertEqual(Payer.objects.filter(debt_item=debt).count(), 1)
        self.assertEqual(InvolvedPerson.objects.filter(debt_item=debt).count(), 3)

    def test_add_debt_rejects_mismatched_payer_total(self):
        self.client.force_login(self.user)
        payload = {
            "accountingName": "Bad Split",
            "debtItem": {
                "name": "Dinner",
                "price": 90,
                "date": "2026-06-10",
                "payers": [{"name": "Reza", "amount": 50}],
                "involvedPersons": ["Reza", "Sina"],
            },
        }

        response = self.client.post(
            "/api/accountings/add-debt/",
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(UserAccounting.objects.filter(name="Bad Split").exists())

    def test_settlement_endpoint_returns_expected_balances(self):
        self.client.force_login(self.user)
        accounting = UserAccounting.objects.create(user=self.user, name="Shared Dinner")
        debt = DebtItem.objects.create(
            user_accounting=accounting,
            name="Dinner",
            price=Decimal("90.00"),
            date=date(2026, 6, 10),
        )
        Payer.objects.create(debt_item=debt, name="Reza", paid_amount=Decimal("90.00"))
        InvolvedPerson.objects.bulk_create([
            InvolvedPerson(debt_item=debt, name="Reza"),
            InvolvedPerson(debt_item=debt, name="Sina"),
            InvolvedPerson(debt_item=debt, name="Sara"),
        ])

        response = self.client.get(f"/api/accountings/{accounting.id}/settle/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["final_balances"], {
            "Reza": "60.00",
            "Sina": "-30.00",
            "Sara": "-30.00",
        })

    def test_accounting_detail_is_limited_to_owner(self):
        other_user = get_user_model().objects.create_user(
            username="Sina",
            email="sina@example.com",
            password="password123",
        )
        private_accounting = UserAccounting.objects.create(
            user=other_user,
            name="Private Accounting",
        )
        self.client.force_login(self.user)

        response = self.client.get(f"/api/accountings/{private_accounting.id}/")

        self.assertEqual(response.status_code, 404)

    def test_change_password_endpoint(self):
        self.client.force_login(self.user)
        response = self.client.post(
            "/api/user/change-password/",
            data=json.dumps({
                "currentPassword": "password123",
                "newPassword": "new-password-456",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("new-password-456"))

    def test_delete_account_requires_correct_password(self):
        self.client.force_login(self.user)
        response = self.client.delete(
            "/api/user/account/",
            data=json.dumps({"password": "wrong-password"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertTrue(get_user_model().objects.filter(pk=self.user.pk).exists())

    def test_delete_account_removes_current_user(self):
        self.client.force_login(self.user)
        response = self.client.delete(
            "/api/user/account/",
            data=json.dumps({"password": "password123"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(get_user_model().objects.filter(pk=self.user.pk).exists())

    def test_authenticated_post_requires_csrf_token_when_csrf_checks_are_enabled(self):
        csrf_client = Client(enforce_csrf_checks=True)
        csrf_client.force_login(self.user)
        payload = {
            "accountingName": "CSRF Check",
            "debtItem": {
                "name": "Dinner",
                "price": 30,
                "date": "2026-06-10",
                "payers": [{"name": "Reza", "amount": 30}],
                "involvedPersons": ["Reza"],
            },
        }

        response = csrf_client.post(
            "/api/accountings/add-debt/",
            data=json.dumps(payload),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)

    def test_authenticated_post_accepts_valid_csrf_token(self):
        csrf_client = Client(enforce_csrf_checks=True)
        csrf_client.force_login(self.user)
        csrf_client.get("/dashboard/")
        csrf_token = csrf_client.cookies["csrftoken"].value
        payload = {
            "accountingName": "CSRF Check",
            "debtItem": {
                "name": "Dinner",
                "price": 30,
                "date": "2026-06-10",
                "payers": [{"name": "Reza", "amount": 30}],
                "involvedPersons": ["Reza"],
            },
        }

        response = csrf_client.post(
            "/api/accountings/add-debt/",
            data=json.dumps(payload),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, 201)
