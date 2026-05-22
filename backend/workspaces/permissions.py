from rest_framework.permissions import BasePermission

from core.errors import ForbiddenError, NotFoundError
from core.logging import get_logger
from workspaces.models import Workspace


log = get_logger()


class IsWorkspaceMember(BasePermission):
    """For routes scoped to a workspace.

    Order of checks matches the API contract anti-pieges:
      1. Does the workspace exist? Else 404.
      2. Is the caller a member? Else 403.

    The resolved Workspace instance is attached to the view as
    `view.workspace` so handlers and services can use it without
    a second DB query.
    """

    def has_permission(self, request, view) -> bool:
        workspace_id = view.kwargs.get("workspace_id")
        if not workspace_id:
            return True

        user_id = getattr(request.user, "user_id", None)

        try:
            workspace = Workspace.objects.get(pk=workspace_id)
        except (Workspace.DoesNotExist, ValueError):
            log.info(
                "scoping.denied",
                reason="workspace_not_found",
                user_id=user_id,
                workspace_id=str(workspace_id),
                method=request.method,
                path=request.path,
            )
            raise NotFoundError("Workspace not found.")

        if not workspace.has_member(user_id):
            log.info(
                "scoping.denied",
                reason="not_a_member",
                user_id=user_id,
                workspace_id=str(workspace.id),
                method=request.method,
                path=request.path,
            )
            raise ForbiddenError("Not a member of this workspace.")

        view.workspace = workspace
        return True
