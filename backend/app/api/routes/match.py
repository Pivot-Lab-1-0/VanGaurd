"""
Match / Dispatch Routes
=======================
POST /api/match/dispatch   — Run matching engine, write to matches table
GET  /api/match/{problem_id} — Fetch existing matches for a problem
POST /api/match/confirm    — Volunteer uploads proof + confirms resolution
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone

from app.db.session import get_db
from app.services.matching_engine import find_top_volunteers, VolunteerScore
from app.models.match import Match, MatchStatus
from app.models.problem import Problem, ProblemStatus

router = APIRouter(prefix="/api/match", tags=["Matching Engine"])

CONSENSUS_THRESHOLD = 5   # How many confirmations to auto-close a problem


# ── Request / Response Schemas ──────────────────────────────────────────────

class DispatchRequest(BaseModel):
    problem_id: str


class VolunteerScoreResponse(BaseModel):
    volunteer_id:   str
    display_name:   str
    phone_number:   str
    skills:         list[str]
    distance_km:    float
    vanguard_score: float
    skill_match:    float
    distance_score: float
    urgency_score:  float
    latitude:       float
    longitude:      float
    rank:           int


class DispatchResponse(BaseModel):
    problem_id:       str
    problem_title:    str
    urgency:          int
    dispatched_count: int
    volunteers:       list[VolunteerScoreResponse]
    message:          str


class ConfirmRequest(BaseModel):
    problem_id:     str
    volunteer_id:   str
    proof_image_url: Optional[str] = None


class MatchResponse(BaseModel):
    id:             str
    problem_id:     str
    volunteer_id:   str
    display_name:   str
    vanguard_score: float
    distance_km:    float
    skill_match:    float
    status:         str
    dispatched_at:  str
    responded_at:   Optional[str]


# ── POST /api/match/dispatch ────────────────────────────────────────────────

@router.post("/dispatch", response_model=DispatchResponse, status_code=status.HTTP_201_CREATED)
def dispatch_volunteers(payload: DispatchRequest, db: Session = Depends(get_db)):
    """
    The core dispatch endpoint.

    Flow:
    1. Fetch the problem (validate it exists and is open/dispatched)
    2. Extract problem's lat/lng from PostGIS geography column
    3. Run the matching engine
    4. Write Match rows to DB (idempotent — skips existing matches)
    5. Update problem status to 'dispatched'
    6. Return ranked volunteer list with score breakdown
    """

    # ── 1. Fetch and validate problem ───────────────────────────────────────
    problem = db.query(Problem).filter(Problem.id == payload.problem_id).first()

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem {payload.problem_id} not found."
        )

    if problem.status in [ProblemStatus.resolved, ProblemStatus.closed]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Problem is already {problem.status.value}. Cannot re-dispatch."
        )

    # ── 2. Extract lat/lng from JSON location ────────────────────────────
    coords = db.execute(
        text("SELECT json_extract(location, '$.lat') AS lat, json_extract(location, '$.lng') AS lng "
             "FROM problems WHERE id = :pid"),
        {"pid": problem.id}
    ).fetchone()

    if not coords:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Problem has no valid location data."
        )

    problem_lat = float(coords.lat)
    problem_lng = float(coords.lng)

    # ── 3. Run matching engine ───────────────────────────────────────────────
    top_volunteers: list[VolunteerScore] = find_top_volunteers(
        db             = db,
        problem_id     = problem.id,
        required_skill = problem.required_skill,
        urgency        = problem.urgency,
        problem_lat    = problem_lat,
        problem_lng    = problem_lng,
    )

    if not top_volunteers:
        # Don't fail — return informative response
        return DispatchResponse(
            problem_id       = problem.id,
            problem_title    = problem.title,
            urgency          = problem.urgency,
            dispatched_count = 0,
            volunteers       = [],
            message          = "⚠️ No available volunteers found within 100km with matching skills."
        )

    # ── 4. Write Match rows (idempotent) ────────────────────────────────────
    newly_dispatched = 0

    for rank, volunteer in enumerate(top_volunteers, start=1):
        # Check if this match already exists (re-dispatch safety)
        existing = db.query(Match).filter(
            Match.problem_id   == problem.id,
            Match.volunteer_id == volunteer.volunteer_id,
        ).first()

        if existing:
            continue  # Already dispatched to this volunteer — skip

        match_row = Match(
            problem_id     = problem.id,
            volunteer_id   = volunteer.volunteer_id,
            vanguard_score = volunteer.vanguard_score,
            skill_match    = volunteer.skill_match,
            distance_km    = volunteer.distance_km,
            distance_score = volunteer.distance_score,
            urgency_score  = volunteer.urgency_score,
            status         = MatchStatus.notified,
        )
        db.add(match_row)
        newly_dispatched += 1

    # ── 5. Update problem status ─────────────────────────────────────────────
    if problem.status == ProblemStatus.open:
        problem.status = ProblemStatus.dispatched

    db.commit()

    # ── 6. Build response ────────────────────────────────────────────────────
    volunteer_responses = [
        VolunteerScoreResponse(
            volunteer_id   = v.volunteer_id,
            display_name   = v.display_name,
            phone_number   = v.phone_number,
            skills         = v.skills,
            distance_km    = v.distance_km,
            vanguard_score = v.vanguard_score,
            skill_match    = v.skill_match,
            distance_score = v.distance_score,
            urgency_score  = v.urgency_score,
            latitude       = v.latitude,
            longitude      = v.longitude,
            rank           = rank,
        )
        for rank, v in enumerate(top_volunteers, start=1)
    ]

    return DispatchResponse(
        problem_id       = problem.id,
        problem_title    = problem.title,
        urgency          = problem.urgency,
        dispatched_count = newly_dispatched,
        volunteers       = volunteer_responses,
        message          = f"✅ Dispatched to {newly_dispatched} volunteer(s). Vanguard is active."
    )


# ── GET /api/match/{problem_id} ─────────────────────────────────────────────

@router.get("/{problem_id}", response_model=list[MatchResponse])
def get_matches_for_problem(problem_id: str, db: Session = Depends(get_db)):
    """
    Fetch all dispatch records for a given problem.
    Used by NGO dashboard to see who was sent, their scores, and response status.
    """
    rows = db.execute(text("""
        SELECT
            m.id,
            m.problem_id,
            m.volunteer_id,
            COALESCE(u.display_name, 'Anonymous') AS display_name,
            m.vanguard_score,
            m.distance_km,
            m.skill_match,
            m.status,
            m.dispatched_at,
            m.responded_at
        FROM matches m
        JOIN users u ON u.id = m.volunteer_id
        WHERE m.problem_id = :problem_id
        ORDER BY m.vanguard_score DESC
    """), {"problem_id": problem_id}).fetchall()

    return [
        MatchResponse(
            id             = row.id,
            problem_id     = row.problem_id,
            volunteer_id   = row.volunteer_id,
            display_name   = row.display_name,
            vanguard_score = row.vanguard_score,
            distance_km    = row.distance_km,
            skill_match    = row.skill_match,
            status         = row.status,
            dispatched_at  = row.dispatched_at.isoformat(),
            responded_at   = row.responded_at.isoformat() if row.responded_at else None,
        )
        for row in rows
    ]


# ── POST /api/match/confirm ─────────────────────────────────────────────────

@router.post("/confirm", status_code=status.HTTP_200_OK)
def confirm_resolution(payload: ConfirmRequest, db: Session = Depends(get_db)):
    """
    Decentralized Consensus endpoint.

    Flow:
    1. Volunteer uploads proof and marks their match as 'confirmed'
    2. Increment problem.confirmation_count
    3. If count >= CONSENSUS_THRESHOLD (5) → auto-resolve the problem
    4. Return current consensus progress
    """

    # ── 1. Find the match record ─────────────────────────────────────────────
    match = db.query(Match).filter(
        Match.problem_id   == payload.problem_id,
        Match.volunteer_id == payload.volunteer_id,
    ).first()

    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No dispatch record found for this volunteer/problem pair."
        )

    if match.status == MatchStatus.confirmed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already confirmed this resolution."
        )

    # ── 2. Update match record ───────────────────────────────────────────────
    match.status          = MatchStatus.confirmed
    match.proof_image_url = payload.proof_image_url
    match.confirmed_at    = datetime.now(timezone.utc)
    match.responded_at    = datetime.now(timezone.utc)

    # ── 3. Increment problem consensus count ─────────────────────────────────
    problem = db.query(Problem).filter(Problem.id == payload.problem_id).first()

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found.")

    problem.confirmation_count += 1

    # ── 4. Auto-resolve if consensus threshold met ───────────────────────────
    auto_resolved = False
    if problem.confirmation_count >= CONSENSUS_THRESHOLD:
        problem.status      = ProblemStatus.resolved
        problem.resolved_at = datetime.now(timezone.utc)
        auto_resolved       = True

    db.commit()

    return {
        "problem_id":          payload.problem_id,
        "volunteer_id":        payload.volunteer_id,
        "confirmation_count":  problem.confirmation_count,
        "consensus_threshold": CONSENSUS_THRESHOLD,
        "auto_resolved":       auto_resolved,
        "message": (
            f"🏆 Problem auto-resolved by consensus! ({CONSENSUS_THRESHOLD}/{CONSENSUS_THRESHOLD})"
            if auto_resolved else
            f"✅ Confirmation recorded. ({problem.confirmation_count}/{CONSENSUS_THRESHOLD})"
        )
    }