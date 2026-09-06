import logging

from fastapi import APIRouter, HTTPException

from app.schemas.schema_models import (
    GeneratedSchema,
    ModifySchemaRequest,
    SchemaRequest,
    SchemaResponse,
)
from app.services import ai_service
from app.services.ai_service import AIServiceError
from app.services.schema_analyzer import AnalysisResult, analyze_schema
from app.services.schema_validator import SchemaValidationError, validate_schema
from app.services.sql import generate_all_sql

logger = logging.getLogger("schemaforge.api")

router = APIRouter()


@router.get("/")
def read_root():
    return {"message": "SchemaForge AI Backend Running"}


def _with_sql(schema) -> GeneratedSchema:
    """Attach deterministically generated SQL for every dialect."""
    return GeneratedSchema(**schema.model_dump(), sql=generate_all_sql(schema))


@router.post("/generate-schema", response_model=GeneratedSchema)
def generate_schema(payload: SchemaRequest) -> GeneratedSchema:
    try:
        schema = ai_service.generate_schema(payload.description)
    except SchemaValidationError as exc:
        logger.warning("Schema validation failed: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))
    except AIServiceError as exc:
        logger.warning("Schema generation failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception:  # noqa: BLE001 - never let anything crash the endpoint
        logger.exception("Unexpected error while generating schema")
        raise HTTPException(
            status_code=500,
            detail="Unexpected error while generating the schema.",
        )

    return _with_sql(schema)


@router.post("/generate-sql", response_model=GeneratedSchema)
def generate_sql_endpoint(payload: SchemaResponse) -> GeneratedSchema:
    """Validate a (manually edited) schema and regenerate its SQL. No AI."""
    if not payload.tables:
        raise HTTPException(
            status_code=422, detail="The schema has no tables."
        )
    issues = validate_schema(payload)
    if issues:
        exc = SchemaValidationError(issues)
        logger.warning("Edited schema validation failed: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))
    return _with_sql(payload)


@router.post("/analyze-schema", response_model=AnalysisResult)
def analyze_schema_endpoint(payload: SchemaResponse) -> AnalysisResult:
    """Read-only advisory analysis of a schema. No AI, never modifies it."""
    return analyze_schema(payload)


@router.post("/modify-schema", response_model=GeneratedSchema)
def modify_schema(payload: ModifySchemaRequest) -> GeneratedSchema:
    try:
        schema = ai_service.modify_schema(payload.current_schema, payload.request)
    except SchemaValidationError as exc:
        # The updated schema breaks a validation rule - report every problem.
        logger.warning("Modified schema validation failed: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))
    except AIServiceError as exc:
        logger.warning("Schema modification failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception:  # noqa: BLE001
        logger.exception("Unexpected error while modifying schema")
        raise HTTPException(
            status_code=500,
            detail="Unexpected error while modifying the schema.",
        )

    return _with_sql(schema)
