def test_create_provider_profile_success(client, provider_token, category_id):
    resp = client.post(
        "/providers/profile",
        headers={"Authorization": f"Bearer {provider_token}"},
        json={"category_id": category_id, "description": "20 years experience", "hourly_rate": 1500},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["description"] == "20 years experience"
    assert body["verified"] is False
    assert body["average_rating"] == 0.0


def test_create_provider_profile_as_customer_forbidden(client, customer_token, category_id):
    resp = client.post(
        "/providers/profile",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"category_id": category_id, "description": "should fail"},
    )
    assert resp.status_code == 403


def test_create_duplicate_provider_profile_fails(client, provider_token, category_id, provider_profile):
    resp = client.post(
        "/providers/profile",
        headers={"Authorization": f"Bearer {provider_token}"},
        json={"category_id": category_id, "description": "dup"},
    )
    assert resp.status_code == 400


def test_update_provider_profile(client, provider_token, provider_profile):
    resp = client.put(
        "/providers/profile",
        headers={"Authorization": f"Bearer {provider_token}"},
        json={"hourly_rate": 2000},
    )
    assert resp.status_code == 200
    assert resp.json()["hourly_rate"] == 2000.0


def test_get_provider_by_id(client, provider_profile):
    provider_id = provider_profile["id"]
    resp = client.get(f"/providers/{provider_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == provider_id


def test_get_nonexistent_provider_404(client):
    resp = client.get("/providers/99999")
    assert resp.status_code == 404


def test_search_providers_by_category(client, provider_profile, category_id):
    resp = client.get(f"/providers?category_id={category_id}")
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    resp_empty = client.get("/providers?category_id=99999")
    assert resp_empty.status_code == 200
    assert resp_empty.json() == []


def test_admin_verifies_provider(client, admin_token, provider_profile):
    provider_id = provider_profile["id"]
    resp = client.put(f"/providers/{provider_id}/verify", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.json()["verified"] is True


def test_non_admin_cannot_verify_provider(client, customer_token, provider_profile):
    provider_id = provider_profile["id"]
    resp = client.put(f"/providers/{provider_id}/verify", headers={"Authorization": f"Bearer {customer_token}"})
    assert resp.status_code == 403
