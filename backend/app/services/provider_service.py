import math
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.provider import Provider
from app.models.category import Category
from app.models.user import User, UserRole
from app.schemas.provider_schema import ProviderCreate, ProviderUpdate


def create_provider_profile(db: Session, user: User, data: ProviderCreate) -> Provider:
    if user.role != UserRole.PROVIDER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission",
        )

    existing = db.query(Provider).filter(Provider.user_id == user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider profile already exists for this account",
        )

    category = db.query(Category).filter(Category.id == data.category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    provider = Provider(user_id=user.id, **data.model_dump())
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return provider


def update_provider_profile(db: Session, user: User, data: ProviderUpdate) -> Provider:
    provider = db.query(Provider).filter(Provider.user_id == user.id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider profile not found")

    updates = data.model_dump(exclude_unset=True)
    if "category_id" in updates:
        category = db.query(Category).filter(Category.id == updates["category_id"]).first()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    for field, value in updates.items():
        setattr(provider, field, value)

    db.commit()
    db.refresh(provider)
    return provider


def get_provider_by_id(db: Session, provider_id: int) -> Provider:
    provider = (
        db.query(Provider)
        .options(joinedload(Provider.category), joinedload(Provider.user))
        .filter(Provider.id == provider_id)
        .first()
    )
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
    return provider


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def search_providers(
    db: Session,
    category_id: Optional[int] = None,
    min_rating: Optional[float] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_km: Optional[float] = None,
) -> List[Provider]:
    query = db.query(Provider).options(joinedload(Provider.category), joinedload(Provider.user))

    if category_id is not None:
        query = query.filter(Provider.category_id == category_id)
    if min_rating is not None:
        query = query.filter(Provider.average_rating >= min_rating)
    if min_price is not None:
        query = query.filter(Provider.hourly_rate >= min_price)
    if max_price is not None:
        query = query.filter(Provider.hourly_rate <= max_price)

    providers = query.all()

    # Location filtering done in Python via haversine - fine at hackathon scale,
    # would move to PostGIS ST_DWithin if the provider table grows large.
    if latitude is not None and longitude is not None and radius_km is not None:
        providers = [
            p for p in providers
            if p.latitude is not None and p.longitude is not None
            and _haversine_km(latitude, longitude, p.latitude, p.longitude) <= radius_km
        ]

    return providers


def verify_provider(db: Session, provider_id: int) -> Provider:
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
    provider.verified = True
    db.commit()
    db.refresh(provider)
    return provider
