from pydantic import BaseModel, Field, field_validator
from typing import Optional
from enum import Enum


class ProblemStatus(str, Enum):
    open        = "open"
    dispatched  = "dispatched"
    in_progress = "in_progress"
    resolved    = "resolved"
    closed      = "closed"


class LocationInput(BaseModel):
    """Frontend sends lat/lng — we convert to WKT for PostGIS."""
    latitude:  float = Field(..., ge=-90,  le=90)
    longitude: float = Field(..., ge=-180, le=180)


class ProblemCreate(BaseModel):
    title:          str        = Field(..., min_length=5, max_length=200)
    description:    Optional[str] = None
    required_skill: str        = Field(..., min_length=2)
    urgency:        int        = Field(..., ge=1, le=10)
    location:       LocationInput
    address:        Optional[str] = None
    media_urls:     Optional[str] = None   # comma-separated URLs

    @field_validator("urgency")
    @classmethod
    def urgency_in_range(cls, v):
        if not 1 <= v <= 10:
            raise ValueError("Urgency must be 1–10")
        return v


class ProblemResponse(BaseModel):
    id:                 str
    title:              str
    description:        Optional[str]
    required_skill:     str
    urgency:            int
    status:             ProblemStatus
    address:            Optional[str]
    confirmation_count: int
    latitude:           Optional[float] = None
    longitude:          Optional[float] = None
    created_at:         str

    model_config = {"from_attributes": True}


class ProblemListResponse(BaseModel):
    problems: list[ProblemResponse]
    total:    int