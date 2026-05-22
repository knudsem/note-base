import pytest

from notes.models import Note
from workspaces.models import Workspace


@pytest.fixture
def workspace(db):
    return Workspace.objects.create(name="Team", member_ids=["1"])


@pytest.mark.django_db
def test_create_note_returns_201(as_user, workspace):
    client = as_user("1")
    response = client.post(
        f"/workspaces/{workspace.id}/notes",
        {"title": "First", "content": "Hello"},
        format="json",
    )
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "First"
    assert body["authorId"] == "1"
    assert body["workspaceId"] == str(workspace.id)


@pytest.mark.django_db
def test_create_note_duplicate_title_returns_409(as_user, workspace):
    client = as_user("1")
    client.post(
        f"/workspaces/{workspace.id}/notes",
        {"title": "Same", "content": "A"},
        format="json",
    )
    response = client.post(
        f"/workspaces/{workspace.id}/notes",
        {"title": "Same", "content": "B"},
        format="json",
    )
    assert response.status_code == 409
    assert response.json()["error"] == "ConflictError"


@pytest.mark.django_db
def test_list_notes_paginated_and_sorted_desc(as_user, workspace):
    for i in range(25):
        Note.objects.create(workspace=workspace, title=f"N{i:02}", content="x", author_id="1")

    client = as_user("1")
    page1 = client.get(f"/workspaces/{workspace.id}/notes?page=1&pageSize=10").json()
    assert page1["total"] == 25
    assert len(page1["items"]) == 10
    assert page1["items"][0]["title"] == "N24"

    page3 = client.get(f"/workspaces/{workspace.id}/notes?page=3&pageSize=10").json()
    assert len(page3["items"]) == 5


@pytest.mark.django_db
def test_list_notes_search_is_case_insensitive(as_user, workspace):
    Note.objects.create(workspace=workspace, title="Onboarding", content="x", author_id="1")
    Note.objects.create(workspace=workspace, title="Deploy", content="x", author_id="1")

    client = as_user("1")
    response = client.get(f"/workspaces/{workspace.id}/notes?search=BOARD")
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "Onboarding"


@pytest.mark.django_db
def test_list_notes_page_size_capped_at_100(as_user, workspace):
    Note.objects.create(workspace=workspace, title="One", content="x", author_id="1")
    client = as_user("1")
    response = client.get(f"/workspaces/{workspace.id}/notes?pageSize=500")
    body = response.json()
    assert body["pageSize"] == 100


@pytest.mark.django_db
def test_delete_note_returns_204(as_user, workspace):
    note = Note.objects.create(workspace=workspace, title="Bye", content="x", author_id="1")
    client = as_user("1")
    response = client.delete(f"/workspaces/{workspace.id}/notes/{note.id}")
    assert response.status_code == 204
    assert not Note.objects.filter(pk=note.id).exists()


@pytest.mark.django_db
def test_patch_note_updates_title(as_user, workspace):
    note = Note.objects.create(workspace=workspace, title="Old", content="x", author_id="1")
    client = as_user("1")
    response = client.patch(
        f"/workspaces/{workspace.id}/notes/{note.id}",
        {"title": "New"},
        format="json",
    )
    assert response.status_code == 200
    assert response.json()["title"] == "New"


@pytest.mark.django_db
def test_patch_note_with_conflicting_title_returns_409(as_user, workspace):
    Note.objects.create(workspace=workspace, title="Taken", content="x", author_id="1")
    note = Note.objects.create(workspace=workspace, title="Mine", content="x", author_id="1")
    client = as_user("1")
    response = client.patch(
        f"/workspaces/{workspace.id}/notes/{note.id}",
        {"title": "Taken"},
        format="json",
    )
    assert response.status_code == 409


@pytest.mark.django_db
def test_patch_with_empty_body_returns_400(as_user, workspace):
    note = Note.objects.create(workspace=workspace, title="Old", content="x", author_id="1")
    client = as_user("1")
    response = client.patch(
        f"/workspaces/{workspace.id}/notes/{note.id}",
        {},
        format="json",
    )
    assert response.status_code == 400
