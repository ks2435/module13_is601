from sqlalchemy import text

from database import engine


def test_register_returns_token(client, unique_user):
    r = client.post("/register", json=unique_user)
    assert r.status_code == 201
    body = r.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str)
    assert len(body["access_token"]) > 10


def test_register_hashes_password_in_db(client, unique_user):
    client.post("/register", json=unique_user)
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT password_hash FROM users WHERE email = :e"),
            {"e": unique_user["email"]},
        ).fetchone()
    assert row is not None
    assert row.password_hash != unique_user["password"]
    assert row.password_hash.startswith("$2")


def test_register_duplicate_email_rejected(client, unique_user):
    assert client.post("/register", json=unique_user).status_code == 201
    dup = {**unique_user, "username": "someone_else"}
    assert client.post("/register", json=dup).status_code == 400


def test_register_short_password_rejected(client, unique_user):
    bad = {**unique_user, "password": "abc"}
    r = client.post("/register", json=bad)
    assert r.status_code == 422


def test_register_invalid_email_rejected(client, unique_user):
    bad = {**unique_user, "email": "not-an-email"}
    r = client.post("/register", json=bad)
    assert r.status_code == 422


def test_login_returns_token(client, unique_user):
    client.post("/register", json=unique_user)
    r = client.post(
        "/login",
        json={"email": unique_user["email"], "password": unique_user["password"]},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_wrong_password_returns_401(client, unique_user):
    client.post("/register", json=unique_user)
    r = client.post(
        "/login",
        json={"email": unique_user["email"], "password": "WRONG-pw"},
    )
    assert r.status_code == 401


def test_login_unknown_user_returns_401(client):
    r = client.post(
        "/login", json={"email": "ghost@example.com", "password": "whatever"}
    )
    assert r.status_code == 401


def test_me_requires_token(client):
    assert client.get("/me").status_code == 401


def test_me_with_token(client, unique_user):
    reg = client.post("/register", json=unique_user).json()
    r = client.get(
        "/me", headers={"Authorization": f"Bearer {reg['access_token']}"}
    )
    assert r.status_code == 200
    assert r.json()["email"] == unique_user["email"]