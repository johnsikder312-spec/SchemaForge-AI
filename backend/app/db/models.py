"""SQLAlchemy ORM models."""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import JSON, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _uuid() -> str:
    return str(uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Project(Base):
    """A saved SchemaForge project."""

    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    # The natural-language description the schema was generated from.
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    # The schema structure: { project_name, tables, relationships }.
    schema_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    # Which SQL dialect the user last selected: postgresql | mysql | sqlite.
    sql_dialect: Mapped[str] = mapped_column(
        String(20), default="postgresql", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), default=_utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=_utcnow,
        onupdate=_utcnow,
    )
