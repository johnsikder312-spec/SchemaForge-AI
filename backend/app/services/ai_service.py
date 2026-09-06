"""AI-powered database schema generation and modification.

`generate_schema` designs a schema from a plain-language description.
`modify_schema` applies a plain-language change to an existing schema and
returns the COMPLETE updated schema (never a partial one).

Both go through Claude with structured output, validate the result against
`SchemaResponse` (Pydantic) and then `schema_validator`. Malformed or refused
responses become a clean `AIServiceError`; a structurally invalid schema
becomes a `SchemaValidationError`. The schema is never silently modified.
"""

import json
import logging

import anthropic
import pydantic

from app.config import get_settings
from app.schemas.schema_models import SchemaResponse
from app.services.schema_validator import SchemaValidationError, validate_schema

logger = logging.getLogger("schemaforge.ai")

MAX_TOKENS = 16000

_RULES = (
    "Rules (the output is validated against these and rejected if it breaks "
    "them):\n"
    "- Every table must have exactly one primary key column.\n"
    "- Table and column names must be lowercase snake_case: letters, digits "
    "and underscores only, starting with a letter. No spaces, no capitals.\n"
    "- No duplicate table names; no duplicate column names within a table.\n"
    "- Every column marked foreign_key: true must have a matching entry in "
    "relationships whose source_table/source_column point to it and whose "
    "target_table/target_column point to a real column in another table.\n"
    "- Every relationship must reference tables and columns that exist in the "
    "schema.\n"
    "- relationship_type must be exactly one of: one_to_one, one_to_many, "
    "many_to_one, many_to_many.\n"
    "- Use only standard SQL data types, e.g. INTEGER, BIGINT, VARCHAR(n), "
    "CHAR(n), TEXT, BOOLEAN, DATE, TIMESTAMP, NUMERIC(p,s), UUID, JSONB.\n"
    "- Return ONLY the structured schema data. No prose, no explanation, "
    "no markdown."
)

GENERATE_SYSTEM_PROMPT = (
    "You are a senior database architect. Given a plain-language description of "
    "an application, design a clean relational database schema for it.\n\n"
    "Identify a short project_name, the tables needed, each table's columns "
    "with an appropriate SQL data type, which columns are primary keys "
    "(primary_key: true) and foreign keys (foreign_key: true), and the "
    "relationships between tables (source table/column, target table/column, "
    "relationship_type).\n\n" + _RULES
)

MODIFY_SYSTEM_PROMPT = (
    "You are a senior database architect acting as an assistant that edits an "
    "existing relational database schema.\n\n"
    "You are given the current schema as JSON and a plain-language change "
    "request. Apply ONLY the requested change and return the COMPLETE updated "
    "schema.\n\n"
    "Critical:\n"
    "- Return the ENTIRE schema, not just the part that changed.\n"
    "- Preserve every table, column, and relationship that the request does "
    "not touch, exactly as they were (same names, types, keys).\n"
    "- Keep the same project_name unless the request asks to change it.\n"
    "- When adding a table, give it a primary key and sensible columns.\n"
    "- When the request is to connect two tables, add the foreign key column "
    "(if missing), mark it foreign_key: true, and add the relationship entry.\n"
    "- When removing a table, also remove relationships that reference it.\n"
    "- If the request cannot be applied, return the schema unchanged.\n\n"
    + _RULES
)


class AIServiceError(Exception):
    """Raised for any failure producing a valid schema from the AI."""


def _build_client() -> anthropic.Anthropic:
    settings = get_settings()
    if not settings.ai_configured:
        raise AIServiceError(
            "AI service is not configured. Set ANTHROPIC_API_KEY in backend/.env."
        )
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


def _request_schema(system_prompt: str, user_message: str) -> SchemaResponse:
    """Call Claude for a structured schema. Every failure mode is turned into
    a clean AIServiceError; a valid `SchemaResponse` is returned otherwise."""
    client = _build_client()
    model = get_settings().ai_model

    try:
        response = client.messages.parse(
            model=model,
            max_tokens=MAX_TOKENS,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
            output_format=SchemaResponse,
        )
    except anthropic.AuthenticationError:
        logger.exception("Anthropic authentication failed")
        raise AIServiceError(
            "AI service authentication failed. Check ANTHROPIC_API_KEY."
        )
    except anthropic.PermissionDeniedError:
        logger.exception("Anthropic permission denied")
        raise AIServiceError("AI service rejected the request (permission denied).")
    except anthropic.RateLimitError:
        logger.warning("Anthropic rate limit hit")
        raise AIServiceError(
            "AI service is rate limited right now. Please try again shortly."
        )
    except anthropic.APIConnectionError:
        logger.exception("Could not connect to Anthropic")
        raise AIServiceError(
            "Could not reach the AI service. Please try again shortly."
        )
    except anthropic.APIStatusError as exc:
        logger.exception("Anthropic API error (status %s)", exc.status_code)
        raise AIServiceError(f"AI service error (HTTP {exc.status_code}).")
    except (
        pydantic.ValidationError,
        json.JSONDecodeError,
        anthropic.APIResponseValidationError,
    ):
        logger.exception("AI returned malformed / invalid schema JSON")
        raise AIServiceError(
            "The AI returned a malformed schema. Please try again."
        )
    except anthropic.AnthropicError:
        logger.exception("Unexpected Anthropic SDK error")
        raise AIServiceError("Unexpected error talking to the AI service.")

    if response.stop_reason == "refusal":
        logger.warning("AI refused the request: %s", response.stop_details)
        raise AIServiceError("The AI declined to handle this request.")

    schema = response.parsed_output
    if schema is None:
        logger.error(
            "AI response could not be parsed into a schema (stop_reason=%s)",
            response.stop_reason,
        )
        raise AIServiceError(
            "The AI did not return a valid schema. Try rephrasing your request."
        )
    return schema


def _validate(schema: SchemaResponse) -> SchemaResponse:
    issues = validate_schema(schema)
    if issues:
        logger.warning(
            "Schema failed validation: %s",
            "; ".join(issue.message for issue in issues),
        )
        raise SchemaValidationError(issues)
    return schema


def generate_schema(description: str) -> SchemaResponse:
    """Generate and validate a database schema for the given description."""
    schema = _request_schema(
        GENERATE_SYSTEM_PROMPT,
        f"Design the database schema for this application:\n\n{description}",
    )
    if not schema.tables:
        logger.warning("AI returned a schema with no tables")
        raise AIServiceError(
            "The AI could not derive any tables from that description. "
            "Add more detail and try again."
        )
    return _validate(schema)


def modify_schema(
    current_schema: SchemaResponse, request: str
) -> SchemaResponse:
    """Apply a plain-language change to an existing schema and return the
    COMPLETE updated schema (validated)."""
    current_json = current_schema.model_dump_json(indent=2)
    user_message = (
        f"Current schema:\n```json\n{current_json}\n```\n\n"
        f"Change request:\n{request}\n\n"
        "Return the complete updated schema."
    )
    schema = _request_schema(MODIFY_SYSTEM_PROMPT, user_message)
    if not schema.tables:
        logger.warning("AI returned an empty schema after modification")
        raise AIServiceError(
            "The updated schema came back empty. Please try rephrasing the "
            "request."
        )
    return _validate(schema)
