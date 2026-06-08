from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture
def client(monkeypatch):
    original_activities = deepcopy(app_module.activities)

    monkeypatch.setattr(app_module, "activities", deepcopy(original_activities))

    with TestClient(app_module.app) as test_client:
        yield test_client

    monkeypatch.setattr(app_module, "activities", original_activities)


def test_root_redirects_to_static_index(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_seed_data(client):
    response = client.get("/activities")

    assert response.status_code == 200
    payload = response.json()
    assert "Chess Club" in payload
    assert isinstance(payload["Chess Club"]["participants"], list)


def test_signup_adds_participant(client):
    email = "pytest-student@example.edu"

    response = client.post("/activities/Chess Club/signup", params={"email": email})

    assert response.status_code == 200
    assert email in app_module.activities["Chess Club"]["participants"]


def test_duplicate_signup_returns_400(client):
    email = "duplicate@example.edu"

    client.post("/activities/Chess Club/signup", params={"email": email})
    response = client.post("/activities/Chess Club/signup", params={"email": email})

    assert response.status_code == 400


def test_unregister_removes_participant(client):
    email = "remove-me@example.edu"
    app_module.activities["Chess Club"]["participants"].append(email)

    response = client.post("/activities/Chess Club/unregister", params={"email": email})

    assert response.status_code == 200
    assert email not in app_module.activities["Chess Club"]["participants"]
