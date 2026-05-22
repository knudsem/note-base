import json

from django.db import transaction
from django.db.models import QuerySet

from core.errors import ForbiddenError
from core.logging import get_logger
from workspaces.models import Workspace


log = get_logger()


def list_workspaces_for(user_id: str) -> QuerySet[Workspace]:
    """SQLite JSON field has no native list-contains, so we match the JSON-encoded
    representation as a substring. `json.dumps("1")` yields `"1"`, which uniquely
    matches that exact id inside a JSON list (quotes prevent prefix collisions
    like `"1"` vs `"10"`).
    """
    needle = json.dumps(user_id)
    return Workspace.objects.filter(member_ids__icontains=needle)


def create_workspace(name: str, creator_id: str) -> Workspace:
    workspace = Workspace.objects.create(name=name, member_ids=[creator_id])
    log.info(
        "workspace.created",
        user_id=creator_id,
        workspace_id=str(workspace.id),
    )
    return workspace


def add_member(workspace: Workspace, caller_id: str, new_member_id: str) -> Workspace:
    """Adds new_member_id to workspace, idempotent and concurrency-safe.

    The select_for_update inside a transaction prevents lost updates if two
    callers add different members simultaneously.
    """
    if not workspace.has_member(caller_id):
        log.info(
            "scoping.denied",
            action="add_member",
            user_id=caller_id,
            workspace_id=str(workspace.id),
        )
        raise ForbiddenError("Not a member of this workspace.")

    with transaction.atomic():
        locked = Workspace.objects.select_for_update().get(pk=workspace.id)
        if new_member_id in locked.member_ids:
            return locked
        locked.member_ids = [*locked.member_ids, new_member_id]
        locked.save(update_fields=["member_ids"])

    log.info(
        "workspace.member_added",
        user_id=caller_id,
        workspace_id=str(workspace.id),
        new_member_id=new_member_id,
    )
    return locked
