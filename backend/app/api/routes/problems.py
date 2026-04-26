from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from app.db.session import get_db
from app.models.problem import Problem, ProblemStatus
from app.schemas.problems import ProblemCreate, ProblemResponse, ProblemListResponse

router = APIRouter(prefix="/api/problems", tags=["Problems"])


@router.post("/", response_model=ProblemResponse, status_code=status.HTTP_201_CREATED)
def create_problem(payload: ProblemCreate, db: Session = Depends(get_db)):
    """
    File a new problem report.
    Converts frontend lat/lng → PostGIS GEOGRAPHY point.
    After creation, caller should hit /api/match/dispatch.
    """
    # Build WKT point — PostGIS expects (longitude, latitude)
    wkt = f"SRID=4326;POINT({payload.location.longitude} {payload.location.latitude})"

    problem = Problem(
        title          = payload.title,
        description    = payload.description,
        reported_by    = "demo-user-id",   # Replace with real auth user ID
        required_skill = payload.required_skill,
        urgency        = payload.urgency,
        location       = wkt,
        address        = payload.address,
        media_urls     = payload.media_urls,
    )
    db.add(problem)
    db.commit()
    db.refresh(problem)

    # Re-fetch coordinates for response
    coords = db.execute(
        text("SELECT json_extract(location, '$.lat') AS lat, json_extract(location, '$.lng') AS lng "
             "FROM problems WHERE id = :pid"),
        {"pid": problem.id}
    ).fetchone()

    return ProblemResponse(
        id                 = problem.id,
        title              = problem.title,
        description        = problem.description,
        required_skill     = problem.required_skill,
        urgency            = problem.urgency,
        status             = problem.status,
        address            = problem.address,
        confirmation_count = problem.confirmation_count,
        latitude           = float(coords.lat) if coords else None,
        longitude          = float(coords.lng) if coords else None,
        created_at         = problem.created_at.isoformat(),
    )


@router.get("/", response_model=ProblemListResponse)
def list_problems(
    status_filter: Optional[str] = None,
    limit:  int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    List all problems — with optional status filter.
    Returns lat/lng extracted from PostGIS for the map.
    """
    rows = db.execute(text("""
        SELECT
            p.id, p.title, p.description, p.required_skill,
            p.urgency, p.status, p.address, p.confirmation_count,
            p.created_at,
            json_extract(p.location, '$.lat') AS latitude,
            json_extract(p.location, '$.lng') AS longitude
        FROM problems p
        WHERE (:status_filter IS NULL OR p.status = :status_filter)
        ORDER BY p.urgency DESC, p.created_at DESC
        LIMIT :limit OFFSET :offset
    """), {
        "status_filter": status_filter,
        "limit":         limit,
        "offset":        offset,
    }).fetchall()

    total = db.execute(
        text("SELECT COUNT(*) FROM problems WHERE (:s IS NULL OR status = :s)"),
        {"s": status_filter}
    ).scalar()

    return ProblemListResponse(
        problems=[
            ProblemResponse(
                id                 = r.id,
                title              = r.title,
                description        = r.description,
                required_skill     = r.required_skill,
                urgency            = r.urgency,
                status             = r.status,
                address            = r.address,
                confirmation_count = r.confirmation_count,
                latitude           = float(r.latitude)  if r.latitude  else None,
                longitude          = float(r.longitude) if r.longitude else None,
                created_at         = r.created_at.isoformat(),
            )
            for r in rows
        ],
        total=total or 0
    )