from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "dev-only-not-for-production"
DEBUG = False
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "rest_framework",
    "workspaces",
    "notes",
]

MIDDLEWARE = [
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
        "OPTIONS": {
            "timeout": 20,
        },
        "TEST": {
            "NAME": BASE_DIR / "test_db.sqlite3",
        },
    }
}

TIME_ZONE = "UTC"
USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
APPEND_SLASH = False

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "core.authentication.HeaderUserAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "core.authentication.IsAuthenticatedByHeader",
    ],
    "DEFAULT_PAGINATION_CLASS": "core.pagination.ContractPagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "core.exception_handler.contract_exception_handler",
    "UNAUTHENTICATED_USER": None,
}
