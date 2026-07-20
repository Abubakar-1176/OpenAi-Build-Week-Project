from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.booking_schema import BookingCreate, BookingOut
from app.services import booking_service

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut, status_code=201)
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return booking_service.create_booking(db, current_user, data)


@router.get("", response_model=List[BookingOut])
def get_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return booking_service.get_bookings_for_user(db, current_user)


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return booking_service.get_booking_detail(db, booking_id, current_user)


@router.put("/{booking_id}/accept", response_model=BookingOut)
def accept_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return booking_service.accept_booking(db, booking_id, current_user)


@router.put("/{booking_id}/reject", response_model=BookingOut)
def reject_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return booking_service.reject_booking(db, booking_id, current_user)


@router.put("/{booking_id}/complete", response_model=BookingOut)
def complete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return booking_service.complete_booking(db, booking_id, current_user)


@router.delete("/{booking_id}", response_model=BookingOut)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return booking_service.cancel_booking(db, booking_id, current_user)
