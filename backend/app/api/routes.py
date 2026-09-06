import logging

from fastapi import APIRouter, HTTPException

from app.schemas.schema_models import SchemaRequest, SchemaResponse
from app.services import ai_service
from app.services.ai_service import AIServiceError
from app.services.schema_validator import SchemaValidationError

logger = logging.getLogger("schemaforge.api")

router = APIRouter()


@router.get("/")
def read_root():
    return {"message": "SchemaForge AI Backend Running"}


@router.post("/generate-schema", response_model=SchemaResponse)
def generate_schema(payload: SchemaRequest) -> SchemaResponse:
    try:
        return ai_service.generate_schema(payload.description)
    except SchemaValidationError as exc:
        # The AI produced a schema that breaks one or more validation rules.
        # Report every problem; the schema is never silently corrected.
        logger.warning("Schema validation failed: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))
    except AIServiceError as exc:
        # Expected, handled failure (misconfig, rate limit, bad AI output, ...).
        logger.warning("Schema generation failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception:  # noqa: BLE001 - never let anything crash the endpoint
        logger.exception("Unexpected error while generating schema")
        raise HTTPException(
            status_code=500,
            detail="Unexpected error while generating the schema.",
        )
