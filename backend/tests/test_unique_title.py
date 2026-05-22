"""Proves the unique-title-per-workspace constraint holds at the DB layer.

The contract demands that two simultaneous POSTs with the same title must
never create two notes. We rely on a composite UNIQUE constraint
(workspace_id, title) plus an IntegrityError catch in the service layer.

These tests verify both the static constraint (sequential inserts) and the
concurrent case (parallel threads racing on the same title).
"""

import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

import pytest
from django.db import IntegrityError, connections, transaction

from workspaces.models import Workspace
from notes.models import Note


@pytest.fixture
def workspace(db):
    return Workspace.objects.create(name="Backend Team", member_ids=["1"])


@pytest.mark.django_db
def test_same_title_in_same_workspace_is_rejected(workspace):
    Note.objects.create(
        workspace=workspace, title="Onboarding", content="x", author_id="1"
    )
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            Note.objects.create(
                workspace=workspace, title="Onboarding", content="y", author_id="1"
            )
    assert Note.objects.filter(workspace=workspace).count() == 1


@pytest.mark.django_db
def test_same_title_in_different_workspace_is_allowed(workspace):
    other = Workspace.objects.create(name="Sales", member_ids=["2"])
    Note.objects.create(
        workspace=workspace, title="Onboarding", content="x", author_id="1"
    )
    Note.objects.create(
        workspace=other, title="Onboarding", content="y", author_id="2"
    )
    assert Note.objects.count() == 2


@pytest.mark.django_db(transaction=True)
def test_concurrent_creates_with_same_title_produce_one_note(workspace):
    """Race condition stress test: N threads, same workspace, same title.

    Exactly one must succeed; the others must hit IntegrityError. We assert
    that the final state has exactly one note, regardless of which thread won.
    """

    thread_count = 8
    barrier = threading.Barrier(thread_count)
    successes: list[bool] = []
    failures: list[Exception] = []

    def attempt_create():
        barrier.wait()
        try:
            with transaction.atomic():
                Note.objects.create(
                    workspace=workspace,
                    title="Race",
                    content="content",
                    author_id="1",
                )
            successes.append(True)
        except IntegrityError as exc:
            failures.append(exc)
        finally:
            connections.close_all()

    with ThreadPoolExecutor(max_workers=thread_count) as pool:
        futures = [pool.submit(attempt_create) for _ in range(thread_count)]
        for f in as_completed(futures):
            f.result()

    assert len(successes) == 1
    assert len(failures) == thread_count - 1
    assert Note.objects.filter(workspace=workspace, title="Race").count() == 1
