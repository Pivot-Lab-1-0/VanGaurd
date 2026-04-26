"""
Run from backend/ with venv active:
  python seed.py
"""
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.problem import Problem, ProblemStatus

db = SessionLocal()

# ── Seed Volunteers ──────────────────────────────────────────────────────────
volunteers = [
    {
        "id": "vol-001", "phone_number": "+919876543210",
        "display_name": "Arjun Sharma", "role": UserRole.volunteer,
        "skills": ["medical", "first_aid"], "is_available": True,
        # Jaipur area
        "location": "SRID=4326;POINT(75.7873 26.9124)"
    },
    {
        "id": "vol-002", "phone_number": "+919876543211",
        "display_name": "Priya Patel", "role": UserRole.volunteer,
        "skills": ["water_sanitation", "construction"], "is_available": True,
        # Ajmer area
        "location": "SRID=4326;POINT(74.6399 26.4499)"
    },
    {
        "id": "vol-003", "phone_number": "+919876543212",
        "display_name": "Ravi Kumar", "role": UserRole.volunteer,
        "skills": ["education", "medical"], "is_available": True,
        # Jodhpur area
        "location": "SRID=4326;POINT(73.0243 26.2389)"
    },
    {
        "id": "vol-004", "phone_number": "+919876543213",
        "display_name": "Sunita Devi", "role": UserRole.volunteer,
        "skills": ["medical", "nutrition"], "is_available": True,
        # Kota area
        "location": "SRID=4326;POINT(75.8648 25.2138)"
    },
    {
        "id": "vol-005", "phone_number": "+919876543214",
        "display_name": "Mohit Singh", "role": UserRole.volunteer,
        "skills": ["construction", "solar_energy"], "is_available": True,
        # Udaipur area
        "location": "SRID=4326;POINT(73.6833 24.5854)"
    },
]

# ── Seed NGO + Villager ──────────────────────────────────────────────────────
other_users = [
    {
        "id": "ngo-001", "phone_number": "+919000000001",
        "display_name": "Seva Foundation", "role": UserRole.ngo,
        "skills": [], "is_available": False,
        "location": "SRID=4326;POINT(75.7873 26.9124)"
    },
    {
        "id": "villager-001", "phone_number": "+919000000002",
        "display_name": "Ramesh Meena", "role": UserRole.villager,
        "skills": [], "is_available": False,
        "location": "SRID=4326;POINT(75.5 26.7)"
    },
]

for u_data in volunteers + other_users:
    existing = db.query(User).filter(User.id == u_data["id"]).first()
    if not existing:
        user = User(**u_data)
        db.add(user)

# ── Seed a Problem ───────────────────────────────────────────────────────────
existing_problem = db.query(Problem).filter(Problem.id == "prob-001").first()
if not existing_problem:
    problem = Problem(
        id             = "prob-001",
        title          = "Medical emergency — child with high fever",
        description    = "Child 4yr old, 104°F fever, no transport to hospital.",
        reported_by    = "villager-001",
        required_skill = "medical",
        urgency        = 9,
        status         = ProblemStatus.open,
        location       = "SRID=4326;POINT(75.52 26.72)",  # Rural Rajasthan
        address        = "Village Kalyanpura, Dist. Jaipur, Rajasthan",
    )
    db.add(problem)

db.commit()
db.close()
print("✅ Seed data inserted. Run dispatch against prob-001 to test the engine.")