from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Provider(Base):
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    description = Column(Text, nullable=True)
    experience = Column(Integer, nullable=True)
    hourly_rate = Column(Float, nullable=True)
    address = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    profile_image = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    average_rating = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="provider_profile")
    category = relationship("Category", back_populates="providers")
    bookings = relationship("Booking", back_populates="provider")
    reviews = relationship("Review", back_populates="provider")
    availability_slots = relationship("Availability", back_populates="provider", cascade="all, delete-orphan")
