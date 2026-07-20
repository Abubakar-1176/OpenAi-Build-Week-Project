from sqlalchemy import Column, Integer, String, Time, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Availability(Base):
    __tablename__ = "availability"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    day = Column(String, nullable=False)  # e.g. "Monday"
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    provider = relationship("Provider", back_populates="availability_slots")
