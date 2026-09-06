"""Project persistence CRUD.

Thin data-access layer over the `Project` ORM model. Endpoints handle HTTP
concerns; this module only talks to the database.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Project
from app.schemas.project_schemas import ProjectCreate, ProjectUpdate


def list_projects(db: Session) -> list[Project]:
    stmt = select(Project).order_by(Project.updated_at.desc())
    return list(db.scalars(stmt))


def get_project(db: Session, project_id: str) -> Project | None:
    return db.get(Project, project_id)


def create_project(db: Session, payload: ProjectCreate) -> Project:
    project = Project(
        name=payload.name.strip(),
        description=payload.description or "",
        schema_json=payload.schema_data.model_dump(mode="json"),
        sql_dialect=payload.normalised_dialect(),
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(
    db: Session, project: Project, payload: ProjectUpdate
) -> Project:
    if payload.name is not None:
        project.name = payload.name.strip()
    if payload.description is not None:
        project.description = payload.description
    if payload.schema_data is not None:
        project.schema_json = payload.schema_data.model_dump(mode="json")
    if payload.sql_dialect is not None and payload.sql_dialect in {
        "postgresql",
        "mysql",
        "sqlite",
    }:
        project.sql_dialect = payload.sql_dialect
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: Project) -> None:
    db.delete(project)
    db.commit()
