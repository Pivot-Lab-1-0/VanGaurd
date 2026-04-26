from app.db.base import Base
from app.db.session import engine

# Import all models so SQLAlchemy registers them on Base.metadata
from app.models import user, problem, match   # noqa: F401


def init_db():
    """
    Creates all tables. Safe to call on startup.
    For production, use Alembic migrations instead.
    """
    Base.metadata.create_all(bind=engine)
    print("✅ Vanguard DB tables created (or already exist).")


if __name__ == "__main__":
    init_db()