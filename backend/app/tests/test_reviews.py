def _create_and_complete_booking(client, customer_token, provider_token, provider_id, date="2026-09-10"):
    booking_resp = client.post(
        "/bookings",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"provider_id": provider_id, "date": date, "time": "10:00:00"},
    )
    booking_id = booking_resp.json()["id"]
    client.put(f"/bookings/{booking_id}/accept", headers={"Authorization": f"Bearer {provider_token}"})
    client.put(f"/bookings/{booking_id}/complete", headers={"Authorization": f"Bearer {provider_token}"})
    return booking_id


def test_review_before_completion_fails(client, customer_token, provider_profile):
    booking_resp = client.post(
        "/bookings",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"provider_id": provider_profile["id"], "date": "2026-09-11", "time": "10:00:00"},
    )
    booking_id = booking_resp.json()["id"]

    resp = client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"booking_id": booking_id, "rating": 5, "comment": "too early"},
    )
    assert resp.status_code == 400
    assert "completed" in resp.json()["detail"].lower()


def test_review_after_completion_succeeds(client, customer_token, provider_token, provider_profile):
    booking_id = _create_and_complete_booking(client, customer_token, provider_token, provider_profile["id"])

    resp = client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"booking_id": booking_id, "rating": 5, "comment": "Excellent!"},
    )
    assert resp.status_code == 201
    assert resp.json()["rating"] == 5


def test_duplicate_review_fails(client, customer_token, provider_token, provider_profile):
    booking_id = _create_and_complete_booking(client, customer_token, provider_token, provider_profile["id"])

    first = client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"booking_id": booking_id, "rating": 4, "comment": "Good"},
    )
    assert first.status_code == 201

    second = client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"booking_id": booking_id, "rating": 2, "comment": "trying again"},
    )
    assert second.status_code == 400


def test_review_rating_out_of_range_rejected(client, customer_token, provider_token, provider_profile):
    booking_id = _create_and_complete_booking(client, customer_token, provider_token, provider_profile["id"])

    resp = client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"booking_id": booking_id, "rating": 7, "comment": "too high"},
    )
    assert resp.status_code == 422


def test_review_updates_provider_average_rating(client, customer_token, provider_token, provider_profile):
    booking_id = _create_and_complete_booking(client, customer_token, provider_token, provider_profile["id"])
    client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"booking_id": booking_id, "rating": 5, "comment": "Great"},
    )

    resp = client.get(f"/providers/{provider_profile['id']}")
    assert resp.json()["average_rating"] == 5.0


def test_other_customer_cannot_review_someone_elses_booking(client, customer_token, provider_token, provider_profile):
    booking_id = _create_and_complete_booking(client, customer_token, provider_token, provider_profile["id"])

    client.post(
        "/auth/register",
        json={"name": "Other", "email": "otherreviewer@test.com", "password": "testpass123", "role": "CUSTOMER"},
    )
    other_login = client.post("/auth/login", json={"email": "otherreviewer@test.com", "password": "testpass123"})
    other_token = other_login.json()["access_token"]

    resp = client.post(
        "/reviews",
        headers={"Authorization": f"Bearer {other_token}"},
        json={"booking_id": booking_id, "rating": 1, "comment": "not my booking"},
    )
    assert resp.status_code == 403
