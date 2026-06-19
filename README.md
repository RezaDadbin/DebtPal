# DebtPal

DebtPal is a small Django project for tracking shared debts. It lets a user create accounting groups, add debt items, record who paid, record who was involved, and calculate a simple settlement plan.

This is a student project, so the focus is on keeping the code understandable and easy to run locally rather than presenting it as a production finance product.

## What This Demonstrates

- A Django application with separated development and production settings
- Template-based frontend pages backed by JSON endpoints
- Basic authentication, account ownership, and protected views
- Settlement logic for splitting shared expenses
- GitHub-ready project structure with tests, CI, Docker, and deployment notes

## Features

- Email or username based login
- Signup, login, dashboard, settings, and transactions pages
- Accounting groups owned by each user
- Debt items with payers and involved people
- Settlement calculation for each accounting group
- Django admin support
- Basic REST-style endpoints used by the frontend

## Tech Stack

- Python 3.11+
- Django
- Django REST Framework
- WhiteNoise for production static files
- SQLite for local development
- Plain HTML, CSS, and JavaScript templates/static files

## Project Structure

```text
debtpal/
├── .github/workflows/django.yml
├── .python-version
├── Dockerfile
├── Procfile
├── README.md
├── docs/
│   ├── entity_relationship_diagram.png
│   └── er-diagram-original.png
├── requirements.txt
└── src/
    ├── manage.py
    ├── api/
    │   ├── models.py
    │   ├── views.py
    │   ├── serializers.py
    │   ├── urls.py
    │   ├── templates/api/
    │   └── static/api/
    └── debtpal_project/
        ├── settings/
        │   ├── base.py
        │   ├── dev.py
        │   └── prod.py
        ├── urls.py
        ├── asgi.py
        └── wsgi.py
```

## Local Setup

From the project root:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python src/manage.py migrate
python src/manage.py runserver 127.0.0.1:8000
```

Open:

```text
http://127.0.0.1:8000/
```

Optional admin user:

```bash
python src/manage.py createsuperuser
```

Admin URL:

```text
http://127.0.0.1:8000/admin/
```

## Configuration

Local development uses the development settings module by default:

```text
debtpal_project.settings.dev
```

For deployment, configure these values on the hosting platform:

```text
DJANGO_SETTINGS_MODULE
SECRET_KEY
ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS
CSRF_TRUSTED_ORIGINS
DATABASE_URL
SECURE_SSL_REDIRECT
SESSION_COOKIE_SECURE
CSRF_COOKIE_SECURE
SECURE_HSTS_SECONDS
```

## Database

The local SQLite database is created by:

```bash
python src/manage.py migrate
```

By default the local database file is:

```text
src/debtpal_project/db.sqlite3
```

This file is local development data and is not part of the repository. A fresh clone should run migrations instead of using someone else's SQLite file.

## Tests

Run:

```bash
python src/manage.py check
python src/manage.py test api
```

The GitHub Actions workflow runs the same checks on push and pull request.

## Main URLs

```text
/                         login page
/signup/                  signup page
/dashboard/               dashboard, login required
/transactions/            transactions view, login required
/settings/                settings view, login required
/admin/                   Django admin
/api/auth/signup/         signup API
/api/auth/login/          login API
/api/auth/logout/         logout API
/api/accountings/         current user's accountings
/api/accountings/add-debt/
/api/accountings/<id>/
/api/accountings/<id>/settle/
/api/user/change-password/
/api/user/account/
/health/
```

## Production Notes

For production, set:

```text
DJANGO_SETTINGS_MODULE=debtpal_project.settings.prod
SECRET_KEY=<strong secret>
ALLOWED_HOSTS=<your domain>
CSRF_TRUSTED_ORIGINS=https://<your domain>
DATABASE_URL=postgres://user:password@host:5432/dbname
```

Then run:

```bash
python src/manage.py collectstatic --noinput
python src/manage.py migrate
gunicorn debtpal_project.wsgi:application --chdir src --bind 0.0.0.0:8000
```

Static files are served through WhiteNoise when using production settings. HTTPS-related settings are controlled by environment variables so they can match the hosting platform.

## Entity Relationship Diagram

The ER diagram is in:

```text
docs/entity_relationship_diagram.png
```

It shows the main app models: `User`, `UserAccounting`, `DebtItem`, `Payer`, `InvolvedPerson`, and `ListItem`.

## Repository Notes

- Keep `requirements.txt`, migrations, templates, static files, and source code committed.
- For deployment, use production settings and set `SECRET_KEY`, `ALLOWED_HOSTS`, and any database environment variables on the server.

## Authors

- Reza Dadbin
- Sina Lotfi
