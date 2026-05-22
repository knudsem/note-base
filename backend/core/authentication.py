from dataclasses import dataclass

from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import BasePermission


@dataclass(frozen=True)
class HeaderUser:
    """Lightweight identity carrier. Not a Django User, by design."""

    user_id: str

    @property
    def is_authenticated(self) -> bool:
        return bool(self.user_id)


class HeaderUserAuthentication(BaseAuthentication):
    """Reads X-User-Id from the request and returns a HeaderUser.

    No real authentication. The header is trusted as-is, per the test brief.
    """

    def authenticate(self, request):
        user_id = request.META.get("HTTP_X_USER_ID")
        if not user_id:
            return None
        return (HeaderUser(user_id=str(user_id).strip()), None)


class IsAuthenticatedByHeader(BasePermission):
    """Rejects requests without a usable X-User-Id."""

    message = "X-User-Id header is required."

    def has_permission(self, request, view) -> bool:
        return bool(request.user and getattr(request.user, "is_authenticated", False))
