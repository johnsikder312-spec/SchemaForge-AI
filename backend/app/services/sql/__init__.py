"""Deterministic multi-dialect SQL generation from a validated schema.

No AI. `SchemaResponse` in, DDL strings out. Each dialect's rules live in
`dialects.py`; the shared walk lives in `renderer.py`.
"""

from app.schemas.schema_models import SchemaResponse

from .dialects import DIALECTS, SUPPORTED_DIALECTS
from .renderer import render_sql

__all__ = [
    "SUPPORTED_DIALECTS",
    "generate_sql",
    "generate_all_sql",
]


def generate_sql(schema: SchemaResponse, dialect_key: str) -> str:
    """Generate DDL for one dialect ('postgresql' | 'mysql' | 'sqlite')."""
    try:
        dialect = DIALECTS[dialect_key]
    except KeyError:
        raise ValueError(f"Unsupported SQL dialect: {dialect_key!r}")
    return render_sql(schema, dialect)


def generate_all_sql(schema: SchemaResponse) -> dict[str, str]:
    """Generate DDL for every supported dialect, keyed by dialect name."""
    return {key: render_sql(schema, DIALECTS[key]) for key in SUPPORTED_DIALECTS}
