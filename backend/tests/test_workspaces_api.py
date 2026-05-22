import pytest

from workspaces.models import Workspace


@pytest.mark.django_db
def test_create_workspace_adds_creator_as_member(as_user):
    client = as_user("7")
    response = client.post("/workspaces", {"name": "My team"}, format="json")
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "My team"
    assert body["memberIds"] == ["7"]
    assert "id" in body
    assert "createdAt" in body


@pytest.mark.django_db
def test_list_workspaces_returns_only_my_memberships(as_user):
    Workspace.objects.create(name="Mine", member_ids=["1"])
    Workspace.objects.create(name="Theirs", member_ids=["2"])
    Workspace.objects.create(name="Both", member_ids=["1", "2"])

    client = as_user("1")
    response = client.get("/workspaces")
    assert response.status_code == 200
    body = response.json()
    names = sorted(item["name"] for item in body["items"])
    assert names == ["Both", "Mine"]
    assert body["total"] == 2


@pytest.mark.django_db
def test_create_workspace_invalid_payload_returns_400(as_user):
    client = as_user("1")
    response = client.post("/workspaces", {"name": ""}, format="json")
    assert response.status_code == 400
    assert response.json()["error"] == "InvalidPayloadError"


@pytest.mark.django_db
def test_add_member_by_existing_member(as_user):
    workspace = Workspace.objects.create(name="Team", member_ids=["1"])
    client = as_user("1")
    response = client.post(
        f"/workspaces/{workspace.id}/members",
        {"userId": "2"},
        format="json",
    )
    assert response.status_code == 200
    assert sorted(response.json()["memberIds"]) == ["1", "2"]


@pytest.mark.django_db
def test_add_member_is_idempotent(as_user):
    workspace = Workspace.objects.create(name="Team", member_ids=["1", "2"])
    client = as_user("1")
    response = client.post(
        f"/workspaces/{workspace.id}/members",
        {"userId": "2"},
        format="json",
    )
    assert response.status_code == 200
    assert sorted(response.json()["memberIds"]) == ["1", "2"]


@pytest.mark.django_db
def test_add_member_by_non_member_returns_403(as_user):
    workspace = Workspace.objects.create(name="Team", member_ids=["1"])
    client = as_user("99")
    response = client.post(
        f"/workspaces/{workspace.id}/members",
        {"userId": "2"},
        format="json",
    )
    assert response.status_code == 403
