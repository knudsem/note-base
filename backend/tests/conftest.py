import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def as_user(api_client):
    def _set(user_id: str) -> APIClient:
        api_client.credentials(HTTP_X_USER_ID=user_id)
        return api_client

    return _set
