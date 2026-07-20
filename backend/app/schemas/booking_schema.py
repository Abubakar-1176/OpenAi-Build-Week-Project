from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.booking import BookingStatus, PaymentStatus, PaymentMethod


class BookingCreate(BaseModel):
    provider_id: int
    date: date
    time: time
    address: Optional[str] = None
    notes: Optional[str] = None
    payment_method: PaymentMethod = PaymentMethod.CASH


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    provider_id: int
    booking_date: date
    booking_time: time
    address: Optional[str] = None
    notes: Optional[str] = None
    status: BookingStatus
    payment_status: PaymentStatus
    payment_method: PaymentMethod
    created_at: datetime
    updated_at: datetime
