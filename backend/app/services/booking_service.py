from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.booking import Booking, BookingStatus, PaymentStatus
from app.models.provider import Provider
from app.models.user import User, UserRole
from app.schemas.booking_schema import BookingCreate
from app.services.notification_service import notify


def create_booking(db: Session, customer: User, data: BookingCreate) -> Booking:
    if customer.role != UserRole.CUSTOMER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission")

    provider = db.query(Provider).filter(Provider.id == data.provider_id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")

    # Slot-conflict check: same provider can't hold two active bookings at the same date+time
    conflict = (
        db.query(Booking)
        .filter(
            Booking.provider_id == data.provider_id,
            Booking.booking_date == data.date,
            Booking.booking_time == data.time,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.ACCEPTED]),
        )
        .first()
    )
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Selected time slot is not available",
        )

    booking = Booking(
        customer_id=customer.id,
        provider_id=data.provider_id,
        booking_date=data.date,
        booking_time=data.time,
        address=data.address,
        notes=data.notes,
        status=BookingStatus.PENDING,
        payment_method=data.payment_method,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    notify(
        db, provider.user_id,
        "New booking request",
        f"You have a new booking request for {data.date} at {data.time}.",
    )
    return booking


def get_booking_or_404(db: Session, booking_id: int) -> Booking:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return booking


def _assert_owns_as_customer(booking: Booking, user: User):
    if booking.customer_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission")


def _assert_owns_as_provider(db: Session, booking: Booking, user: User):
    provider = db.query(Provider).filter(Provider.id == booking.provider_id).first()
    if not provider or provider.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission")


def get_bookings_for_user(db: Session, user: User) -> list[Booking]:
    if user.role == UserRole.CUSTOMER:
        return db.query(Booking).filter(Booking.customer_id == user.id).order_by(Booking.booking_date.desc()).all()
    if user.role == UserRole.PROVIDER:
        provider = db.query(Provider).filter(Provider.user_id == user.id).first()
        if not provider:
            return []
        return db.query(Booking).filter(Booking.provider_id == provider.id).order_by(Booking.booking_date.desc()).all()
    # Admin sees everything
    return db.query(Booking).order_by(Booking.booking_date.desc()).all()


def get_booking_detail(db: Session, booking_id: int, user: User) -> Booking:
    booking = get_booking_or_404(db, booking_id)
    if user.role == UserRole.CUSTOMER:
        _assert_owns_as_customer(booking, user)
    elif user.role == UserRole.PROVIDER:
        _assert_owns_as_provider(db, booking, user)
    return booking


def accept_booking(db: Session, booking_id: int, provider_user: User) -> Booking:
    booking = get_booking_or_404(db, booking_id)
    _assert_owns_as_provider(db, booking, provider_user)
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Cannot accept a booking that is {booking.status.value}")
    booking.status = BookingStatus.ACCEPTED
    booking.payment_status = PaymentStatus.PAID
    db.commit()
    db.refresh(booking)
    notify(db, booking.customer_id, "Booking accepted", f"Your booking for {booking.booking_date} was accepted.")
    return booking


def reject_booking(db: Session, booking_id: int, provider_user: User) -> Booking:
    booking = get_booking_or_404(db, booking_id)
    _assert_owns_as_provider(db, booking, provider_user)
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Cannot reject a booking that is {booking.status.value}")
    booking.status = BookingStatus.REJECTED
    db.commit()
    db.refresh(booking)
    notify(db, booking.customer_id, "Booking rejected", f"Your booking for {booking.booking_date} was rejected.")
    return booking


def complete_booking(db: Session, booking_id: int, provider_user: User) -> Booking:
    booking = get_booking_or_404(db, booking_id)
    _assert_owns_as_provider(db, booking, provider_user)
    if booking.status != BookingStatus.ACCEPTED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Cannot complete a booking that is {booking.status.value}")
    booking.status = BookingStatus.COMPLETED
    booking.payment_status = PaymentStatus.COMPLETED
    db.commit()
    db.refresh(booking)
    notify(db, booking.customer_id, "Service completed", f"Your booking for {booking.booking_date} is marked completed. Leave a review!")
    return booking


def cancel_booking(db: Session, booking_id: int, user: User) -> Booking:
    booking = get_booking_or_404(db, booking_id)

    if user.role == UserRole.CUSTOMER:
        _assert_owns_as_customer(booking, user)
    elif user.role == UserRole.PROVIDER:
        _assert_owns_as_provider(db, booking, user)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission")

    if booking.status in (BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REJECTED):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Cannot cancel a booking that is {booking.status.value}")

    booking.status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(booking)

    provider = db.query(Provider).filter(Provider.id == booking.provider_id).first()
    notify(db, provider.user_id, "Booking cancelled", f"Booking for {booking.booking_date} was cancelled.")
    return booking
