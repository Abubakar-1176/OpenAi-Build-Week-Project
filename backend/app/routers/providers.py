from typing import Optional, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.schemas.provider_schema import ProviderCreate, ProviderUpdate, ProviderOut
from app.services import provider_service

router = APIRouter(prefix="/providers", tags=["providers"])


def _to_out(provider) -> ProviderOut:
    out = ProviderOut.model_validate(provider)
    out.provider_name = provider.user.name if provider.user else None
    return out


@router.get("", response_model=List[ProviderOut])
def search_providers(
    category_id: Optional[int] = Query(default=None),
    min_rating: Optional[float] = Query(default=None, ge=0, le=5),
    min_price: Optional[float] = Query(default=None),
    max_price: Optional[float] = Query(default=None),
    latitude: Optional[float] = Query(default=None),
    longitude: Optional[float] = Query(default=None),
    radius_km: Optional[float] = Query(default=None),
    db: Session = Depends(get_db),
):
    providers = provider_service.search_providers(
        db,
        category_id=category_id,
        min_rating=min_rating,
        min_price=min_price,
        max_price=max_price,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
    )
    return [_to_out(p) for p in providers]


@router.get("/{provider_id}", response_model=ProviderOut)
def get_provider(provider_id: int, db: Session = Depends(get_db)):
    provider = provider_service.get_provider_by_id(db, provider_id)
    return _to_out(provider)


@router.post("/profile", response_model=ProviderOut, status_code=201)
def create_profile(
    data: ProviderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    provider = provider_service.create_provider_profile(db, current_user, data)
    return _to_out(provider)


@router.put("/profile", response_model=ProviderOut)
def update_profile(
    data: ProviderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    provider = provider_service.update_provider_profile(db, current_user, data)
    return _to_out(provider)


@router.put("/{provider_id}/verify", response_model=ProviderOut)
def verify_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    provider = provider_service.verify_provider(db, provider_id)
    return _to_out(provider)
