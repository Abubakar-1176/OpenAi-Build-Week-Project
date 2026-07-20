from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_provider
from app.models.user import User
from app.schemas.availability_schema import AvailabilityCreate, AvailabilityUpdate, AvailabilityOut
from app.services import availability_service

router = APIRouter(tags=["availability"])


@router.get("/providers/{provider_id}/availability", response_model=List[AvailabilityOut])
def get_provider_availability(provider_id: int, db: Session = Depends(get_db)):
    return availability_service.get_provider_availability(db, provider_id)


@router.post("/availability", response_model=AvailabilityOut, status_code=201)
def create_availability(
    data: AvailabilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_provider),
):
    return availability_service.create_availability(db, current_user, data)


@router.put("/availability/{slot_id}", response_model=AvailabilityOut)
def update_availability(
    slot_id: int,
    data: AvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_provider),
):
    return availability_service.update_availability(db, current_user, slot_id, data)


@router.delete("/availability/{slot_id}", status_code=204)
def delete_availability(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_provider),
):
    availability_service.delete_availability(db, current_user, slot_id)
    return None
