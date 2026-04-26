import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, 
    DateTime, Enum as SAEnum, ForeignKey, Float, JSON
)
from app.db.base import Base


class ProblemStatus(str, enum.Enum):
    open        = "open"        # Just filed, awaiting dispatch
    dispatched  = "dispatched"  # Volunteers notified
    in_progress = "in_progress" # At least 1 volunteer accepted
    resolved    = "resolved"    # 5 consensus confirmations received
    closed      = "closed"      # NGO manually closed


class UrgencyLevel(int, enum.Enum):
    low      = 1
    moderate = 5
    high     = 8
    critical = 10


class Problem(Base):
    __tablename__ = "problems"

    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title       = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # --- Reporter ---
    reported_by = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    # --- Classification ---
    required_skill  = Column(String(100), nullable=False)   # must match User.skills vocabulary
    urgency         = Column(Integer, nullable=False)        # 1–10
    status          = Column(SAEnum(ProblemStatus), nullable=False, default=ProblemStatus.open)

    # --- Geospatial: where the problem IS ---
    location    = Column(JSON, nullable=False)  # {"lng": float, "lat": float}
    # Human-readable address (reverse-geocoded on frontend, stored here)
    address     = Column(String(300), nullable=True)

    # --- Media ---
    # Comma-separated URLs or JSON array of Firebase Storage URLs
    media_urls  = Column(Text, nullable=True)

    # --- Consensus tracking ---
    confirmation_count = Column(Integer, default=0, nullable=False)  # 0–5

    # --- Timestamps ---
    created_at  = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at  = Column(DateTime(timezone=True),
                         default=lambda: datetime.now(timezone.utc),
                         onupdate=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime(timezone=True), nullable=True)