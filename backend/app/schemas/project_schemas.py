"""Pydantic models for the project-persistence API.

API field name is ``schema_data`` (``schema_json`` would shadow a BaseModel
attribute); it is persisted in the ``projects.schema_json`` column.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.schema_models import SchemaResponse

_DIALECTS = {"postgresql", "mysql", "sqlite"}


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = ""
    schema_data: SchemaResponse = Field(description="The schema structure to save.")
    sql_dialect: str = "postgresql"

    def normalised_dialect(self) -> str:
        return self.sql_dialect if self.sql_dialect in _DIALECTS else "postgresql"


class ProjectUpdate(BaseModel):
    """Partial update - only the provided fields change."""

    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    schema_data: SchemaResponse | None = None
    sql_dialect: str | None = None


class ProjectSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    sql_dialect: str
    created_at: datetime
    updated_at: datetime


class ProjectOut(ProjectSummary):
    description: str
    # Populated from the ORM's `schema_json` column via a computed accessor
    # on the endpoint (see api/projects.py `_to_out`).
    schema_data: SchemaResponse
