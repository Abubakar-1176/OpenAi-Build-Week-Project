import enum

from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    PROVIDER = "PROVIDER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CUSTOMER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    provider_profile = relationship("Provider", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bookings = relationship("Booking", foreign_keys="Booking.customer_id", back_populates="customer")
    reviews = relationship("Review", back_populates="customer")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    chat_history = relationship("AIChatHistory", back_populates="user", cascade="all, delete-orphan")
