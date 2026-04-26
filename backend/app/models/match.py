import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Float, DateTime,
    Enum as SAEnum, ForeignKey, Boolean, Text
)
from app.db.base import Base


class MatchStatus(str, enum.Enum):
    notified  = "notified"   # Volunteer was sent the dispatch
    accepted  = "accepted"   # Volunteer tapped "Accept"
    rejected  = "rejected"   # Volunteer tapped "Decline"
    confirmed = "confirmed"  # Volunteer uploaded proof + confirmed resolved
    expired   = "expired"    # No response within time window


class Match(Base):
    """
    Junction table: one Problem → up to 5 dispatched Volunteers.
    Each row = one volunteer's assignment for one problem.
    The vanguard_score is stored at dispatch time (snapshot).
    """
    __tablename__ = "matches"

    id           = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # --- Foreign Keys ---
    problem_id   = Column(String, ForeignKey("problems.id"), nullable=False, index=True)
    volunteer_id = Column(String, ForeignKey("users.id"),   nullable=False, index=True)

    # --- Algorithm output (stored for audit + explainability) ---
    vanguard_score  = Column(Float, nullable=False)
    skill_match     = Column(Float, nullable=False)   # 1.0 or 0.0
    distance_km     = Column(Float, nullable=False)
    distance_score  = Column(Float, nullable=False)   # 10 / (distance + 1) * W2
    urgency_score   = Column(Float, nullable=False)

    # --- Volunteer response ---
    status          = Column(SAEnum(MatchStatus), nullable=False, default=MatchStatus.notified)
    proof_image_url = Column(Text, nullable=True)     # Firebase Storage URL of "after" photo

    # --- Timestamps ---
    dispatched_at   = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    responded_at    = Column(DateTime(timezone=True), nullable=True)
    confirmed_at    = Column(DateTime(timezone=True), nullable=True)