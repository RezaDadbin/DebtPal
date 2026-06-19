import os
import urllib.parse as _up

from .base import *  # noqa

DEBUG = False
ALLOWED_HOSTS = csv_env("ALLOWED_HOSTS")

SECRET_KEY = os.environ["SECRET_KEY"]
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")


def parse_database_url(url):
    if url.startswith("sqlite:///"):
        return {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": url.replace("sqlite:///", ""),
        }

    parts = _up.urlparse(url)
    if parts.scheme not in {"postgres", "postgresql"}:
        raise ValueError("DATABASE_URL supports postgres://, postgresql://, or sqlite:/// URLs.")

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": parts.path.lstrip("/"),
        "USER": parts.username or "",
        "PASSWORD": parts.password or "",
        "HOST": parts.hostname or "",
        "PORT": str(parts.port or ""),
    }


DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    DATABASES = {"default": parse_database_url(DATABASE_URL)}

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = bool_env("SECURE_SSL_REDIRECT", False)
SESSION_COOKIE_SECURE = bool_env("SESSION_COOKIE_SECURE", True)
CSRF_COOKIE_SECURE = bool_env("CSRF_COOKIE_SECURE", True)
SECURE_HSTS_SECONDS = int_env("SECURE_HSTS_SECONDS", 0)
SECURE_HSTS_INCLUDE_SUBDOMAINS = bool_env("SECURE_HSTS_INCLUDE_SUBDOMAINS", False)
SECURE_HSTS_PRELOAD = bool_env("SECURE_HSTS_PRELOAD", False)
