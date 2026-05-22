from django.db import IntegrityError, transaction
from django.db.models import Q, QuerySet

from core.errors import ConflictError, InvalidPayloadError, NotFoundError
from core.logging import get_logger
from notes.models import Note
from workspaces.models import Workspace


log = get_logger()


def list_notes(workspace: Workspace, search: str | None = None) -> QuerySet[Note]:
    queryset = Note.objects.filter(workspace=workspace)
    if search:
        queryset = queryset.filter(Q(title__icontains=search) | Q(content__icontains=search))
    return queryset


def get_scoped_note(workspace: Workspace, note_id: str) -> Note:
    try:
        return Note.objects.get(workspace=workspace, pk=note_id)
    except (Note.DoesNotExist, ValueError):
        raise NotFoundError("Note not found in this workspace.")


def create_note(workspace: Workspace, author_id: str, title: str, content: str) -> Note:
    try:
        with transaction.atomic():
            note = Note.objects.create(
                workspace=workspace,
                author_id=author_id,
                title=title,
                content=content,
            )
    except IntegrityError:
        log.info(
            "note.create_conflict",
            user_id=author_id,
            workspace_id=str(workspace.id),
        )
        raise ConflictError("A note with this title already exists in this workspace.")

    log.info(
        "note.created",
        user_id=author_id,
        workspace_id=str(workspace.id),
        note_id=str(note.id),
    )
    return note


def update_note(
    workspace: Workspace,
    note_id: str,
    actor_id: str,
    title: str | None = None,
    content: str | None = None,
) -> Note:
    if title is None and content is None:
        raise InvalidPayloadError("At least one of title or content must be provided.")

    note = get_scoped_note(workspace, note_id)
    if title is not None:
        note.title = title
    if content is not None:
        note.content = content

    try:
        with transaction.atomic():
            note.save()
    except IntegrityError:
        log.info(
            "note.update_conflict",
            user_id=actor_id,
            workspace_id=str(workspace.id),
            note_id=str(note.id),
        )
        raise ConflictError("A note with this title already exists in this workspace.")

    log.info(
        "note.updated",
        user_id=actor_id,
        workspace_id=str(workspace.id),
        note_id=str(note.id),
    )
    return note


def delete_note(workspace: Workspace, note_id: str, actor_id: str) -> None:
    note = get_scoped_note(workspace, note_id)
    note.delete()
    log.info(
        "note.deleted",
        user_id=actor_id,
        workspace_id=str(workspace.id),
        note_id=note_id,
    )
