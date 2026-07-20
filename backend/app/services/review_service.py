from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.booking import Booking, BookingStatus
from app.models.review import Review
from app.models.provider import Provider
from app.models.user import User
from app.schemas.review_schema import ReviewCreate
from app.services.notification_service import notify


def create_review(db: Session, customer: User, data: ReviewCreate) -> Review:
    booking = db.query(Booking).filter(Booking.id == data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if booking.customer_id != customer.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission")

    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only completed bookings can be reviewed",
        )

    existing = db.query(Review).filter(Review.booking_id == booking.id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This booking already has a review")

    review = Review(
        booking_id=booking.id,
        customer_id=customer.id,
        provider_id=booking.provider_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    _recalculate_average_rating(db, booking.provider_id)

    provider = db.query(Provider).filter(Provider.id == booking.provider_id).first()
    notify(db, provider.user_id, "New review received", f"You received a {data.rating}-star review.")

    return review


def _recalculate_average_rating(db: Session, provider_id: int) -> None:
    from sqlalchemy import func

    avg = db.query(func.avg(Review.rating)).filter(Review.provider_id == provider_id).scalar()
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    provider.average_rating = round(float(avg), 2) if avg is not None else 0.0
    db.commit()


def get_provider_reviews(db: Session, provider_id: int) -> list[Review]:
    return db.query(Review).filter(Review.provider_id == provider_id).order_by(Review.created_at.desc()).all()
