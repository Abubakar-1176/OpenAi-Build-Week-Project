def test_register_customer_success(client):
    resp = client.post(
        "/auth/register",
        json={"name": "Ali Khan", "email": "ali@test.com", "password": "testpass123", "role": "CUSTOMER"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "ali@test.com"
    assert body["role"] == "CUSTOMER"
    assert "password" not in body
    assert "password_hash" not in body


def test_register_provider_success(client):
    resp = client.post(
        "/auth/register",
        json={"name": "Fahad Electric", "email": "fahad@test.com", "password": "testpass123", "role": "PROVIDER"},
    )
    assert resp.status_code == 201
    assert resp.json()["role"] == "PROVIDER"


def test_register_duplicate_email_fails(client):
    payload = {"name": "Dup", "email": "dup@test.com", "password": "testpass123", "role": "CUSTOMER"}
    first = client.post("/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/auth/register", json=payload)
    assert second.status_code == 400
    assert "already exists" in second.json()["detail"].lower()


def test_login_success(client):
    client.post(
        "/auth/register",
        json={"name": "Ali", "email": "ali2@test.com", "password": "testpass123", "role": "CUSTOMER"},
    )
    resp = client.post("/auth/login", json={"email": "ali2@test.com", "password": "testpass123"})
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert body["user_role"] == "CUSTOMER"


def test_login_wrong_password_fails(client):
    client.post(
        "/auth/register",
        json={"name": "Ali", "email": "ali3@test.com", "password": "testpass123", "role": "CUSTOMER"},
    )
    resp = client.post("/auth/login", json={"email": "ali3@test.com", "password": "wrongpassword"})
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Incorrect email or password"


def test_login_nonexistent_user_fails(client):
    resp = client.post("/auth/login", json={"email": "ghost@test.com", "password": "whatever123"})
    assert resp.status_code == 401


def test_protected_route_requires_token(client):
    resp = client.get("/users/profile")
    assert resp.status_code == 401


def test_protected_route_with_valid_token(client, customer_token):
    resp = client.get("/users/profile", headers={"Authorization": f"Bearer {customer_token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "customer@test.com"


def test_protected_route_with_garbage_token(client):
    resp = client.get("/users/profile", headers={"Authorization": "Bearer not.a.real.token"})
    assert resp.status_code == 401
