"""Project persistence endpoints (no authentication yet)."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.models import Project
from app.schemas.project_schemas import (
    ProjectCreate,
    ProjectOut,
    ProjectSummary,
    ProjectUpdate,
)
from app.services import project_service

logger = logging.getLogger("schemaforge.projects")

router = APIRouter(prefix="/projects", tags=["projects"])


def _to_out(project: Project) -> ProjectOut:
    return ProjectOut(
        id=project.id,
        name=project.name,
        description=project.description,
        schema_data=project.schema_json,
        sql_dialect=project.sql_dialect,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


def _get_or_404(db: Session, project_id: str) -> Project:
    project = project_service.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    return project


@router.get("", response_model=list[ProjectSummary])
def list_projects(db: Session = Depends(get_db)):
    return project_service.list_projects(db)


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    project = project_service.create_project(db, payload)
    logger.info("Created project %s (%s)", project.id, project.name)
    return _to_out(project)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: str, db: Session = Depends(get_db)):
    return _to_out(_get_or_404(db, project_id))


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: str, payload: ProjectUpdate, db: Session = Depends(get_db)
):
    project = _get_or_404(db, project_id)
    return _to_out(project_service.update_project(db, project, payload))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = _get_or_404(db, project_id)
    project_service.delete_project(db, project)
    logger.info("Deleted project %s", project_id)
