"""Tests E2E qui exercent tous les endpoints dans un seul flow réaliste.

L'objectif : démontrer que le scoping, l'unicité, la membership et les CRUD
s'intègrent correctement entre deux utilisateurs partageant un workspace.
"""

import pytest


@pytest.mark.django_db
def test_full_collaboration_flow(as_user):
    """Flow complet : user 1 crée et invite, user 2 collabore, scoping respecté."""

    # === Étape 1 : user 1 crée un workspace ===
    user1 = as_user("1")
    response = user1.post("/workspaces", {"name": "Backend Team"}, format="json")
    assert response.status_code == 201
    workspace_id = response.json()["id"]
    assert response.json()["memberIds"] == ["1"]

    # === Étape 2 : user 2 ne voit rien (scoping) ===
    user2 = as_user("2")
    response = user2.get("/workspaces")
    assert response.status_code == 200
    assert response.json()["total"] == 0

    # === Étape 3 : user 2 essaie d'accéder au workspace de user 1 → 403 ===
    response = user2.get(f"/workspaces/{workspace_id}/notes")
    assert response.status_code == 403
    assert response.json()["error"] == "ForbiddenError"

    # === Étape 4 : user 1 invite user 2 ===
    user1 = as_user("1")
    response = user1.post(
        f"/workspaces/{workspace_id}/members",
        {"userId": "2"},
        format="json",
    )
    assert response.status_code == 200
    assert "2" in response.json()["memberIds"]

    # === Étape 5 : user 2 voit maintenant le workspace ===
    user2 = as_user("2")
    response = user2.get("/workspaces")
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["id"] == workspace_id

    # === Étape 6 : user 1 crée une note ===
    user1 = as_user("1")
    response = user1.post(
        f"/workspaces/{workspace_id}/notes",
        {"title": "Onboarding", "content": "Clone the repo and copy .env.example"},
        format="json",
    )
    assert response.status_code == 201
    note_id = response.json()["id"]
    assert response.json()["authorId"] == "1"

    # === Étape 7 : user 2 voit la note (membre du workspace) ===
    user2 = as_user("2")
    response = user2.get(f"/workspaces/{workspace_id}/notes")
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["id"] == note_id

    # === Étape 8 : user 2 édite la note (pas de check author, tout membre peut) ===
    response = user2.patch(
        f"/workspaces/{workspace_id}/notes/{note_id}",
        {"content": "Updated by user 2"},
        format="json",
    )
    assert response.status_code == 200
    assert response.json()["content"] == "Updated by user 2"
    # authorId reste l'original, on ne le change pas sur un PATCH
    assert response.json()["authorId"] == "1"

    # === Étape 9 : user 1 retrouve la mise à jour ===
    user1 = as_user("1")
    response = user1.get(
        f"/workspaces/{workspace_id}/notes",
        {"search": "Updated"},
    )
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["content"] == "Updated by user 2"

    # === Étape 10 : user 1 tente un titre dupliqué → 409 ===
    response = user1.post(
        f"/workspaces/{workspace_id}/notes",
        {"title": "Onboarding", "content": "duplicate"},
        format="json",
    )
    assert response.status_code == 409
    assert response.json()["error"] == "ConflictError"

    # === Étape 11 : user 2 supprime la note ===
    user2 = as_user("2")
    response = user2.delete(f"/workspaces/{workspace_id}/notes/{note_id}")
    assert response.status_code == 204

    # === Étape 12 : user 1 confirme la suppression ===
    user1 = as_user("1")
    response = user1.get(f"/workspaces/{workspace_id}/notes")
    assert response.status_code == 200
    assert response.json()["total"] == 0
