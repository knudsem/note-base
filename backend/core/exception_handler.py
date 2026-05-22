from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework.exceptions import APIException, ValidationError
from rest_framework import status
from django.http import Http404

from core.errors import InvalidPayloadError, NotFoundError


def contract_exception_handler(exc, context):
    """Renders all API errors as {error, message} per the contract."""

    if isinstance(exc, ValidationError):
        return Response(
            {
                "error": InvalidPayloadError.default_code,
                "message": _flatten_validation_message(exc.detail),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, Http404):
        return Response(
            {"error": NotFoundError.default_code, "message": "Resource not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if isinstance(exc, APIException):
        return Response(
            {
                "error": exc.default_code,
                "message": str(exc.detail) if exc.detail else exc.default_detail,
            },
            status=exc.status_code,
        )

    response = exception_handler(exc, context)
    if response is not None:
        return response

    return Response(
        {"error": "InternalError", "message": "An unexpected error occurred."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _flatten_validation_message(detail) -> str:
    if isinstance(detail, list):
        return _flatten_validation_message(detail[0]) if detail else "Invalid payload."
    if isinstance(detail, dict):
        first_key = next(iter(detail))
        return f"{first_key}: {_flatten_validation_message(detail[first_key])}"
    return str(detail)
