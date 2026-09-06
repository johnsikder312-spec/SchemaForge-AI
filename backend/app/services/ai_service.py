"""AI-powered database schema generation.

Sends the user's application description to Claude and asks for a structured
database schema. The response is validated against `SchemaResponse` (Pydantic);
malformed or refused responses are turned into a clean `AIServiceError` rather
than being allowed to crash the request.
"""

import json
import logging

import anthropic
import pydantic

from app.config import get_settings
from app.schemas.schema_models import SchemaResponse

logger = logging.getLogger("schemaforge.ai")

MAX_TOKENS = 16000

SYSTEM_PROMPT = (
    "You are a senior database architect. Given a plain-language description of "
    "an application, design a clean relational database schema for it.\n\n"
    "Identify:\n"
    "- a short project_name\n"
    "- the tables needed\n"
    "- each table's columns with an appropriate SQL data type "
    "(e.g. INTEGER, BIGINT, VARCHAR(n), TEXT, BOOLEAN, DATE, TIMESTAMP, "
    "NUMERIC(10,2))\n"
    "- which columns are primary keys (primary_key: true)\n"
    "- which columns are foreign keys (foreign_key: true)\n"
    "- the relationships between tables, each with source table/column, "
    "target table/column, and a relationship_type of one_to_one, "
    "one_to_many, many_to_one, or many_to_many\n\n"
    "Rules:\n"
    "- Every table must have a primary key.\n"
    "- Foreign key columns must reference a real column in another table and "
    "appear in the relationships list.\n"
    "- Use snake_case for table and column names.\n"
    "- Return ONLY the structured schema data. No prose, no explanation, "
    "no markdown."
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


def generate_schema(description: str) -> SchemaResponse:
    """Generate and validate a database schema for the given description."""
    client = _build_client()
    model = get_settings().ai_model

    try:
        response = client.messages.parse(
            model=model,
            max_tokens=MAX_TOKENS,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Design the database schema for this application:\n\n"
                        f"{description}"
                    ),
                }
            ],
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
        # The AI produced JSON that does not match the expected schema, or no
        # valid JSON at all. Handle it here instead of letting it propagate.
        logger.exception("AI returned malformed / invalid schema JSON")
        raise AIServiceError(
            "The AI returned a malformed schema. Please try again."
        )
    except anthropic.AnthropicError:
        logger.exception("Unexpected Anthropic SDK error")
        raise AIServiceError("Unexpected error talking to the AI service.")

    if response.stop_reason == "refusal":
        logger.warning("AI refused the request: %s", response.stop_details)
        raise AIServiceError(
            "The AI declined to generate a schema for this description."
        )

    schema = response.parsed_output
    if schema is None:
        logger.error(
            "AI response could not be parsed into a schema (stop_reason=%s)",
            response.stop_reason,
        )
        raise AIServiceError(
            "The AI did not return a valid schema. Try rephrasing your description."
        )

    if not schema.tables:
        logger.warning("AI returned a schema with no tables")
        raise AIServiceError(
            "The AI could not derive any tables from that description. "
            "Add more detail and try again."
        )

    return schema
