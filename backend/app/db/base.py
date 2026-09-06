"""Database engine, session factory and FastAPI dependency.

Persistence is optional: if ``DATABASE_URL`` is not set the engine is never
created, ``get_db`` raises 503, and the rest of the API keeps working.

The target database is PostgreSQL
(``postgresql+psycopg://user:pass@host:5432/dbname``). The models use only
portable column types, so a SQLite URL also works for local experiments.
"""

import logging
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

logger = logging.getLogger("schemaforge.db")


class Base(DeclarativeBase):
    pass


_engine = None
_SessionLocal: sessionmaker[Session] | None = None


def _connect_args(url: str) -> dict:
    if url.startswith("sqlite"):
        return {"check_same_thread": False}
    return {}


def init_db() -> bool:
    """Create the engine and tables. Returns True if persistence is available.

    Never raises: a missing or unreachable database just disables the
    /projects endpoints.
    """
    global _engine, _SessionLocal

    url = get_settings().database_url
    if not url:
        logger.info("DATABASE_URL not set - project persistence disabled.")
        return False

    try:
        _engine = create_engine(
            url, pool_pre_ping=True, connect_args=_connect_args(url)
        )
        # Import models so they are registered on Base.metadata, then create.
        from app.db import models  # noqa: F401

        Base.metadata.create_all(_engine)
        _SessionLocal = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
        logger.info("Project persistence enabled (%s).", _engine.url.render_as_string(hide_password=True))
        return True
    except Exception:
        logger.exception("Could not initialise the database - persistence disabled.")
        _engine = None
        _SessionLocal = None
        return False


def persistence_enabled() -> bool:
    return _SessionLocal is not None


def get_db() -> Iterator[Session]:
    if _SessionLocal is None:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=503,
            detail=(
                "Project persistence is not available. Set DATABASE_URL in "
                "backend/.env and restart the server."
            ),
        )
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()
