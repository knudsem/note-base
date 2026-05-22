from rest_framework.exceptions import APIException
from rest_framework import status


class InvalidPayloadError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "InvalidPayloadError"
    default_detail = "Invalid payload."


class ForbiddenError(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = "ForbiddenError"
    default_detail = "Access denied."


class NotFoundError(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_code = "NotFoundError"
    default_detail = "Resource not found."


class ConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "ConflictError"
    default_detail = "Resource conflict."
