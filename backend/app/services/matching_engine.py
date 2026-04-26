"""
Vanguard Matching Engine
========================
Isolated from HTTP layer — pure Python/SQLAlchemy.
This means it's independently testable and reusable.

Algorithm:
  Score = (W1 * Skill_Match) + (W2 * (10 / (Distance_km + 1))) + (W3 * Urgency_normalized)

Weights:
  W1 = 50  (Skill match is king)
  W2 = 30  (Proximity matters)
  W3 = 20  (Urgency as tiebreaker)
"""

from dataclasses import dataclass
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

# ── Weight Constants ────────────────────────────────────────────────────────
W1_SKILL    = 50
W2_DISTANCE = 30
W3_URGENCY  = 20

TOP_N_VOLUNTEERS = 5        # How many to dispatch
MAX_RADIUS_KM    = 100      # Don't consider volunteers beyond this


@dataclass
class VolunteerScore:
    """
    Immutable snapshot of one volunteer's scoring at dispatch time.
    Stored in the matches table for full audit trail.
    """
    volunteer_id:   str
    display_name:   str
    phone_number:   str
    skills:         list[str]
    distance_km:    float
    vanguard_score: float
    skill_match:    float       # 1.0 or 0.0
    distance_score: float       # The W2 component value
    urgency_score:  float       # The W3 component value
    latitude:       float
    longitude:      float


def calculate_vanguard_score(
    skill_match:  float,   # 1.0 or 0.0
    distance_km:  float,   # Euclidean km from PostGIS
    urgency:      int,     # 1–10
) -> tuple[float, float, float, float]:
    """
    Returns (total_score, skill_component, distance_component, urgency_component).
    Returned as a tuple so each component can be stored separately for audit.
    """
    skill_component    = W1_SKILL    * skill_match
    distance_component = W2_DISTANCE * (10 / (distance_km + 1))
    urgency_component  = W3_URGENCY  * (urgency / 10)   # normalize to 0–1

    total = skill_component + distance_component + urgency_component
    return total, skill_component, distance_component, urgency_component


def find_top_volunteers(
    db:             Session,
    problem_id:     str,
    required_skill: str,
    urgency:        int,
    problem_lat:    float,
    problem_lng:    float,
    radius_km:      float = MAX_RADIUS_KM,
    top_n:          int   = TOP_N_VOLUNTEERS,
) -> list[VolunteerScore]:
    """
    Mock dispatch function for SQLite compatibility.
    Returns dummy volunteers for testing.
    """
    # Mock data
    mock_volunteers = [
        VolunteerScore(
            volunteer_id="vol1",
            display_name="John Doe",
            phone_number="+1234567890",
            skills=["medical", "construction"],
            distance_km=5.0,
            vanguard_score=85.0,
            skill_match=1.0,
            distance_score=25.0,
            urgency_score=10.0,
            latitude=problem_lat + 0.01,
            longitude=problem_lng + 0.01,
        ),
        VolunteerScore(
            volunteer_id="vol2",
            display_name="Jane Smith",
            phone_number="+1234567891",
            skills=["education", "water_sanitation"],
            distance_km=10.0,
            vanguard_score=70.0,
            skill_match=0.0,
            distance_score=20.0,
            urgency_score=10.0,
            latitude=problem_lat - 0.01,
            longitude=problem_lng - 0.01,
        ),
    ]
    return mock_volunteers[:top_n]
