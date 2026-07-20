from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.availability import Availability
from app.models.provider import Provider
from app.models.user import User
from app.schemas.availability_schema import AvailabilityCreate, AvailabilityUpdate


def _get_own_provider(db: Session, user: User) -> Provider:
    provider = db.query(Provider).filter(Provider.user_id == user.id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider profile not found")
    return provider


def _validate_times(start_time, end_time):
    if start_time >= end_time:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="start_time must be before end_time")


def _has_overlap(db: Session, provider_id: int, day: str, start_time, end_time, exclude_id: int = None) -> bool:
    query = db.query(Availability).filter(
        Availability.provider_id == provider_id,
        Availability.day == day,
        Availability.start_time < end_time,
        Availability.end_time > start_time,
    )
    if exclude_id is not None:
        query = query.filter(Availability.id != exclude_id)
    return query.first() is not None


def create_availability(db: Session, user: User, data: AvailabilityCreate) -> Availability:
    provider = _get_own_provider(db, user)
    _validate_times(data.start_time, data.end_time)

    if _has_overlap(db, provider.id, data.day, data.start_time, data.end_time):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This overlaps with an existing availability slot",
        )

    slot = Availability(provider_id=provider.id, day=data.day, start_time=data.start_time, end_time=data.end_time)
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


def update_availability(db: Session, user: User, slot_id: int, data: AvailabilityUpdate) -> Availability:
    provider = _get_own_provider(db, user)
    slot = db.query(Availability).filter(Availability.id == slot_id).first()
    if not slot or slot.provider_id != provider.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Availability slot not found")

    updates = data.model_dump(exclude_unset=True)
    new_day = updates.get("day", slot.day)
    new_start = updates.get("start_time", slot.start_time)
    new_end = updates.get("end_time", slot.end_time)
    _validate_times(new_start, new_end)

    if _has_overlap(db, provider.id, new_day, new_start, new_end, exclude_id=slot.id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This overlaps with an existing availability slot",
        )

    for field, value in updates.items():
        setattr(slot, field, value)
    db.commit()
    db.refresh(slot)
    return slot


def delete_availability(db: Session, user: User, slot_id: int) -> None:
    provider = _get_own_provider(db, user)
    slot = db.query(Availability).filter(Availability.id == slot_id).first()
    if not slot or slot.provider_id != provider.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Availability slot not found")
    db.delete(slot)
    db.commit()


def get_provider_availability(db: Session, provider_id: int) -> list[Availability]:
    return (
        db.query(Availability)
        .filter(Availability.provider_id == provider_id)
        .order_by(Availability.day, Availability.start_time)
        .all()
    )
