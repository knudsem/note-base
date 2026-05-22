"""The four anti-piege scoping tests from the API contract.

These verify the 403 vs 404 distinction that the contract explicitly evaluates.
"""

import pytest

from workspaces.models import Workspace
from notes.models import Note


@pytest.fixture
def workspace_user1(db):
    return Workspace.objects.create(name="Backend", member_ids=["1"])


@pytest.fixture
def workspace_user2(db):
    return Workspace.objects.create(name="Sales", member_ids=["2"])


@pytest.fixture
def note_in_workspace_user1(workspace_user1):
    return Note.objects.create(
        workspace=workspace_user1,
        title="Onboarding",
        content="body",
        author_id="1",
    )


@pytest.mark.django_db
def test_anti_piege_1_non_member_listing_notes_returns_403(
    as_user, workspace_user1
):
    """W exists, caller is not a member. Listing notes => 403."""
    client = as_user("99")
    response = client.get(f"/workspaces/{workspace_user1.id}/notes")
    assert response.status_code == 403
    assert response.json()["error"] == "ForbiddenError"


@pytest.mark.django_db
def test_anti_piege_2_non_member_creating_note_returns_403(
    as_user, workspace_user1
):
    """W exists, caller is not a member. POST note => 403."""
    client = as_user("99")
    response = client.post(
        f"/workspaces/{workspace_user1.id}/notes",
        {"title": "Hack", "content": "Body"},
        format="json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_anti_piege_3_non_member_deleting_note_returns_403(
    as_user, workspace_user1, note_in_workspace_user1
):
    """W exists, note belongs to W, caller is not a member. DELETE => 403."""
    client = as_user("99")
    response = client.delete(
        f"/workspaces/{workspace_user1.id}/notes/{note_in_workspace_user1.id}"
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_anti_piege_4_note_belongs_to_other_workspace_returns_404(
    as_user, workspace_user1, workspace_user2, note_in_workspace_user1
):
    """Caller is member of W2. Tries to DELETE a note via /workspaces/W2/notes/{note-of-W1}.
    Note exists but not in the scope of the requested workspace => 404, not 403.
    """
    client = as_user("2")
    response = client.delete(
        f"/workspaces/{workspace_user2.id}/notes/{note_in_workspace_user1.id}"
    )
    assert response.status_code == 404
    assert response.json()["error"] == "NotFoundError"

    # Sanity: the note still exists in its real workspace.
    assert Note.objects.filter(pk=note_in_workspace_user1.id).exists()


@pytest.mark.django_db
def test_unknown_workspace_returns_404(as_user):
    """Bonus: workspace does not exist at all => 404, not 403."""
    client = as_user("1")
    response = client.get("/workspaces/00000000-0000-0000-0000-000000000000/notes")
    assert response.status_code == 404


@pytest.mark.django_db
def test_missing_user_id_header_returns_403(api_client, workspace_user1):
    """No X-User-Id at all => 403 (unauthorized by the only auth we have)."""
    response = api_client.get(f"/workspaces/{workspace_user1.id}/notes")
    assert response.status_code == 403


@pytest.mark.django_db
def test_malformed_uuid_in_url_returns_404_json(as_user):
    """Garbage in the UUID slot should still produce contract-formatted JSON."""
    client = as_user("1")
    response = client.get("/workspaces/not-a-uuid/notes")
    assert response.status_code == 404
    assert response.json()["error"] == "NotFoundError"


@pytest.mark.django_db
def test_unknown_route_returns_404_json(as_user):
    """Any unknown path should still produce contract-formatted JSON."""
    client = as_user("1")
    response = client.get("/does-not-exist")
    assert response.status_code == 404
    assert response.json()["error"] == "NotFoundError"
