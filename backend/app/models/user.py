import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, DateTime, 
    Enum as SAEnum, Integer, JSON
)
from app.db.base import Base


class UserRole(str, enum.Enum):
    villager  = "villager"
    volunteer = "volunteer"
    ngo       = "ngo"


class User(Base):
    __tablename__ = "users"

    # --- Identity ---
    id            = Column(String, primary_key=True)   # Firebase UID (string, not UUID)
    phone_number  = Column(String(20), unique=True, nullable=False, index=True)
    display_name  = Column(String(100), nullable=True)
    role          = Column(SAEnum(UserRole), nullable=False, default=UserRole.villager)

    # --- Volunteer-specific profile ---
    # e.g. ["medical", "construction", "water_sanitation", "education"]
    skills        = Column(JSON, nullable=True, default=list)
    is_available  = Column(Boolean, default=True, nullable=False)

    # --- Geospatial: last known location ---
    # Store as {"lng": float, "lat": float}
    location      = Column(JSON, nullable=True)

    # --- Trust metrics ---
    tasks_completed = Column(Integer, default=0, nullable=False)
    trust_score     = Column(Integer, default=100, nullable=False)  # 0–1000

    # --- Timestamps ---
    created_at    = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at    = Column(DateTime(timezone=True), 
                           default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    last_seen_at  = Column(DateTime(timezone=True), nullable=True)