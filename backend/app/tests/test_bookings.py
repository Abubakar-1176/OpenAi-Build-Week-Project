def test_create_booking_success(client, customer_token, provider_profile):
    resp = client.post(
        "/bookings",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"provider_id": provider_profile["id"], "date": "2026-09-01", "time": "10:00:00"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "PENDING"
    assert body["payment_status"] == "PENDING"
    assert body["payment_method"] == "CASH"  # default when not specified


def test_create_booking_with_demo_online_payment(client, customer_token, provider_profile):
    resp = client.post(
        "/bookings",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={
            "provider_id": provider_profile["id"],
            "date": "2026-09-05",
            "time": "10:00:00",
            "payment_method": "DEMO_ONLINE",
        },
    )
    assert resp.status_code == 201
    assert resp.json()["payment_method"] == "DEMO_ONLINE"
    assert resp.json()["payment_status"] == "PENDING"


def test_payment_status_transitions_through_booking_lifecycle(
    client, customer_token, provider_token, provider_profile
):
    booking_id = _create_booking(client, customer_token, provider_profile["id"], date="2026-09-06")

    # PENDING at creation
    detail = client.get(f"/bookings/{booking_id}", headers={"Authorization": f"Bearer {customer_token}"})
    assert detail.json()["payment_status"] == "PENDING"

    # PAID once the provider accepts (simulated payment confirmation)
    accept = client.put(f"/bookings/{booking_id}/accept", headers={"Authorization": f"Bearer {provider_token}"})
    assert accept.json()["payment_status"] == "PAID"

    # COMPLETED once the service is marked done
    complete = client.put(f"/bookings/{booking_id}/complete", headers={"Authorization": f"Bearer {provider_token}"})
    assert complete.json()["payment_status"] == "COMPLETED"


def test_create_booking_as_provider_forbidden(client, provider_token, provider_profile):
    resp = client.post(
        "/bookings",
        headers={"Authorization": f"Bearer {provider_token}"},
        json={"provider_id": provider_profile["id"], "date": "2026-09-01", "time": "10:00:00"},
    )
    assert resp.status_code == 403


def test_double_booking_same_slot_conflicts(client, customer_token, provider_profile):
    payload = {"provider_id": provider_profile["id"], "date": "2026-09-02", "time": "11:00:00"}
    first = client.post("/bookings", headers={"Authorization": f"Bearer {customer_token}"}, json=payload)
    assert first.status_code == 201

    second = client.post("/bookings", headers={"Authorization": f"Bearer {customer_token}"}, json=payload)
    assert second.status_code == 409


def _create_booking(client, token, provider_id, date="2026-09-03", time="09:00:00"):
    resp = client.post(
        "/bookings",
        headers={"Authorization": f"Bearer {token}"},
        json={"provider_id": provider_id, "date": date, "time": time},
    )
    return resp.json()["id"]


def test_provider_accepts_booking(client, customer_token, provider_token, provider_profile):
    booking_id = _create_booking(client, customer_token, provider_profile["id"])
    resp = client.put(f"/bookings/{booking_id}/accept", headers={"Authorization": f"Bearer {provider_token}"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "ACCEPTED"


def test_customer_cannot_accept_own_booking(client, customer_token, provider_profile):
    booking_id = _create_booking(client, customer_token, provider_profile["id"])
    resp = client.put(f"/bookings/{booking_id}/accept", headers={"Authorization": f"Bearer {customer_token}"})
    assert resp.status_code == 403


def test_cannot_accept_twice(client, customer_token, provider_token, provider_profile):
    booking_id = _create_booking(client, customer_token, provider_profile["id"])
    client.put(f"/bookings/{booking_id}/accept", headers={"Authorization": f"Bearer {provider_token}"})
    resp = client.put(f"/bookings/{booking_id}/accept", headers={"Authorization": f"Bearer {provider_token}"})
    assert resp.status_code == 409


def test_provider_rejects_booking(client, customer_token, provider_token, provider_profile):
    booking_id = _create_booking(client, customer_token, provider_profile["id"])
    resp = client.put(f"/bookings/{booking_id}/reject", headers={"Authorization": f"Bearer {provider_token}"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "REJECTED"


def test_complete_requires_accepted_first(client, customer_token, provider_token, provider_profile):
    booking_id = _create_booking(client, customer_token, provider_profile["id"])
    # still PENDING - completing should fail
    resp = client.put(f"/bookings/{booking_id}/complete", headers={"Authorization": f"Bearer {provider_token}"})
    assert resp.status_code == 409


def test_full_lifecycle_accept_then_complete(client, customer_token, provider_token, provider_profile):
    booking_id = _create_booking(client, customer_token, provider_profile["id"])
    client.put(f"/bookings/{booking_id}/accept", headers={"Authorization": f"Bearer {provider_token}"})
    resp = client.put(f"/bookings/{booking_id}/complete", headers={"Authorization": f"Bearer {provider_token}"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "COMPLETED"


def test_customer_cancels_own_pending_booking(client, customer_token, provider_profile):
    booking_id = _create_booking(client, customer_token, provider_profile["id"])
    resp = client.delete(f"/bookings/{booking_id}", headers={"Authorization": f"Bearer {customer_token}"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"


def test_cannot_cancel_completed_booking(client, customer_token, provider_token, provider_profile):
    booking_id = _create_booking(client, customer_token, provider_profile["id"])
    client.put(f"/bookings/{booking_id}/accept", headers={"Authorization": f"Bearer {provider_token}"})
    client.put(f"/bookings/{booking_id}/complete", headers={"Authorization": f"Bearer {provider_token}"})
    resp = client.delete(f"/bookings/{booking_id}", headers={"Authorization": f"Bearer {customer_token}"})
    assert resp.status_code == 409


def test_customer_sees_only_own_bookings(client, customer_token, provider_token, provider_profile, db_session):
    _create_booking(client, customer_token, provider_profile["id"])

    # a second, unrelated customer
    client.post(
        "/auth/register",
        json={"name": "Other", "email": "other@test.com", "password": "testpass123", "role": "CUSTOMER"},
    )
    other_login = client.post("/auth/login", json={"email": "other@test.com", "password": "testpass123"})
    other_token = other_login.json()["access_token"]
    other_booking_id = _create_booking(client, other_token, provider_profile["id"], date="2026-09-04")

    # first customer can't see/access the other customer's booking
    resp = client.get(f"/bookings/{other_booking_id}", headers={"Authorization": f"Bearer {customer_token}"})
    assert resp.status_code == 403

    my_bookings = client.get("/bookings", headers={"Authorization": f"Bearer {customer_token}"})
    assert all(b["id"] != other_booking_id for b in my_bookings.json())
