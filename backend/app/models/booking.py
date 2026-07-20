import enum

from sqlalchemy import Column, Integer, String, Text, Date, Time, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    COMPLETED = "COMPLETED"


class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    DEMO_ONLINE = "DEMO_ONLINE"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider_id = Column(Integer, ForeignKey("providers.id"), nullable=False)
    booking_date = Column(Date, nullable=False)
    booking_time = Column(Time, nullable=False)
    address = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(Enum(BookingStatus), nullable=False, default=BookingStatus.PENDING)
    payment_status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    payment_method = Column(Enum(PaymentMethod), nullable=False, default=PaymentMethod.CASH)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("User", foreign_keys=[customer_id], back_populates="bookings")
    provider = relationship("Provider", back_populates="bookings")
    review = relationship("Review", back_populates="booking", uselist=False, cascade="all, delete-orphan")
