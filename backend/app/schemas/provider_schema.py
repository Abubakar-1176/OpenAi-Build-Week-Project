from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.category_schema import CategoryOut


class ProviderCreate(BaseModel):
    category_id: int
    description: Optional[str] = None
    experience: Optional[int] = None
    hourly_rate: Optional[float] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    profile_image: Optional[str] = None


class ProviderUpdate(BaseModel):
    category_id: Optional[int] = None
    description: Optional[str] = None
    experience: Optional[int] = None
    hourly_rate: Optional[float] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    profile_image: Optional[str] = None


class ProviderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    category: CategoryOut
    description: Optional[str] = None
    experience: Optional[int] = None
    hourly_rate: Optional[float] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    profile_image: Optional[str] = None
    verified: bool
    average_rating: float
    created_at: datetime

    # Flattened for convenience on cards/search results
    provider_name: Optional[str] = None


class ProviderSearchParams(BaseModel):
    category_id: Optional[int] = None
    min_rating: Optional[float] = Field(default=None, ge=0, le=5)
    max_price: Optional[float] = None
    min_price: Optional[float] = None
    # Simple bounding-box location filter (no PostGIS for hackathon scope)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = None
