from datetime import time
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

VALID_DAYS = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"}


class AvailabilityCreate(BaseModel):
    day: str
    start_time: time
    end_time: time

    @field_validator("day")
    @classmethod
    def validate_day(cls, v: str) -> str:
        if v not in VALID_DAYS:
            raise ValueError(f"day must be one of {sorted(VALID_DAYS)}")
        return v

    @field_validator("end_time")
    @classmethod
    def validate_end_after_start(cls, v: time, info):
        start = info.data.get("start_time")
        if start is not None and v <= start:
            raise ValueError("end_time must be after start_time")
        return v


class AvailabilityUpdate(BaseModel):
    day: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None

    @field_validator("day")
    @classmethod
    def validate_day(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_DAYS:
            raise ValueError(f"day must be one of {sorted(VALID_DAYS)}")
        return v


class AvailabilityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    provider_id: int
    day: str
    start_time: time
    end_time: time
