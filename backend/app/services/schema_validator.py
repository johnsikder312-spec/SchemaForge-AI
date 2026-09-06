"""Structural validation for a generated database schema.

This runs *after* the AI has produced a schema. It never edits the schema -
it only reports problems so the user can see exactly what is wrong. If any
issue is found the request fails with a clear, itemised message.

Rules enforced:
  1. every table has a primary key
  2. table names are consistent snake_case
  3. column names are consistent snake_case
  4. foreign-key columns are backed by a relationship with a real target
  5. no duplicate table names
  6. no duplicate column names within a table
  7. relationships reference existing tables and columns
  8. column data types are recognisable SQL types
"""

import re

from app.schemas.schema_models import SchemaResponse

# Consistent naming: lowercase snake_case, starting with a letter.
IDENTIFIER_RE = re.compile(r"^[a-z][a-z0-9_]*$")

VALID_RELATIONSHIP_TYPES = {
    "one_to_one",
    "one_to_many",
    "many_to_one",
    "many_to_many",
}

# Recognised SQL data types (case-insensitive, whitespace-normalised).
_TYPES_NO_PARAM = {
    "integer", "int", "int4", "bigint", "int8", "smallint", "int2",
    "serial", "bigserial", "smallserial",
    "boolean", "bool",
    "text", "citext", "xml",
    "date", "time", "timestamp", "timestamptz",
    "timestamp with time zone", "timestamp without time zone",
    "time with time zone", "time without time zone",
    "interval",
    "uuid", "json", "jsonb", "bytea",
    "real", "float4", "double precision", "float8", "float", "money",
    "numeric", "decimal",
    "inet", "cidr", "macaddr",
}
_TYPES_WITH_PARAMS = [
    re.compile(r"^varchar\(\d+\)$"),
    re.compile(r"^character varying\(\d+\)$"),
    re.compile(r"^char\(\d+\)$"),
    re.compile(r"^character\(\d+\)$"),
    re.compile(r"^nchar\(\d+\)$"),
    re.compile(r"^nvarchar\(\d+\)$"),
    re.compile(r"^(numeric|decimal)\(\d+(\s*,\s*\d+)?\)$"),
    re.compile(r"^float\(\d+\)$"),
    re.compile(r"^bit\(\d+\)$"),
    re.compile(r"^varbit\(\d+\)$"),
    re.compile(r"^bit varying\(\d+\)$"),
]


class ValidationIssue:
    """A single problem found in a generated schema."""

    def __init__(self, category: str, message: str) -> None:
        self.category = category
        self.message = message

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"ValidationIssue({self.category!r}, {self.message!r})"


class SchemaValidationError(Exception):
    """Raised when a generated schema fails one or more validation rules."""

    def __init__(self, issues: list[ValidationIssue]) -> None:
        self.issues = issues
        super().__init__(format_issues(issues))


def format_issues(issues: list[ValidationIssue]) -> str:
    count = len(issues)
    header = (
        f"The generated schema failed {count} validation "
        f"check{'' if count == 1 else 's'}. Nothing was changed automatically:"
    )
    return "\n".join([header, *(f"- {issue.message}" for issue in issues)])


def _is_known_type(raw: str) -> bool:
    normalised = " ".join(raw.strip().lower().split())
    if normalised in _TYPES_NO_PARAM:
        return True
    return any(pattern.match(normalised) for pattern in _TYPES_WITH_PARAMS)


def validate_schema(schema: SchemaResponse) -> list[ValidationIssue]:
    """Return every validation problem found. Empty list means the schema is OK."""
    issues: list[ValidationIssue] = []

    seen_tables: dict[str, str] = {}
    columns_by_table: dict[str, set[str]] = {}

    for table in schema.tables:
        table_key = table.name.strip().lower()

        # Rule 5: duplicate table names.
        if table_key in seen_tables:
            issues.append(
                ValidationIssue(
                    "duplicate_table",
                    f"Duplicate table name '{table.name}' "
                    f"(already defined as '{seen_tables[table_key]}').",
                )
            )
            continue
        seen_tables[table_key] = table.name

        # Rule 2: table naming.
        if not IDENTIFIER_RE.match(table.name):
            issues.append(
                ValidationIssue(
                    "table_naming",
                    f"Table name '{table.name}' is not consistent snake_case "
                    f"(lowercase letters, digits and underscores only, "
                    f"starting with a letter).",
                )
            )

        seen_columns: dict[str, str] = {}
        for column in table.columns:
            column_key = column.name.strip().lower()

            # Rule 6: duplicate column names.
            if column_key in seen_columns:
                issues.append(
                    ValidationIssue(
                        "duplicate_column",
                        f"Duplicate column '{column.name}' in table "
                        f"'{table.name}'.",
                    )
                )
            else:
                seen_columns[column_key] = column.name

            # Rule 3: column naming.
            if not IDENTIFIER_RE.match(column.name):
                issues.append(
                    ValidationIssue(
                        "column_naming",
                        f"Column '{table.name}.{column.name}' is not consistent "
                        f"snake_case.",
                    )
                )

            # Rule 8: data types.
            if not _is_known_type(column.type):
                issues.append(
                    ValidationIssue(
                        "invalid_type",
                        f"Column '{table.name}.{column.name}' has an "
                        f"unrecognised data type '{column.type}'.",
                    )
                )

        columns_by_table[table_key] = set(seen_columns)

        # Rule 1: primary key.
        if not any(column.primary_key for column in table.columns):
            issues.append(
                ValidationIssue(
                    "missing_primary_key",
                    f"Table '{table.name}' has no primary key column.",
                )
            )

    # Rule 4: every foreign-key column needs a relationship that defines it.
    relationship_sources = {
        (rel.source_table.strip().lower(), rel.source_column.strip().lower())
        for rel in schema.relationships
    }
    for table in schema.tables:
        table_key = table.name.strip().lower()
        for column in table.columns:
            if column.foreign_key:
                pair = (table_key, column.name.strip().lower())
                if pair not in relationship_sources:
                    issues.append(
                        ValidationIssue(
                            "unlinked_foreign_key",
                            f"Column '{table.name}.{column.name}' is marked as "
                            f"a foreign key but no relationship says which "
                            f"table and column it references.",
                        )
                    )

    # Rule 7: relationships must reference real tables and columns.
    for rel in schema.relationships:
        src_table = rel.source_table.strip().lower()
        tgt_table = rel.target_table.strip().lower()
        src_col = rel.source_column.strip().lower()
        tgt_col = rel.target_column.strip().lower()
        label = (
            f"{rel.source_table}.{rel.source_column} -> "
            f"{rel.target_table}.{rel.target_column}"
        )

        if src_table not in columns_by_table:
            issues.append(
                ValidationIssue(
                    "relationship_unknown_table",
                    f"Relationship {label} references unknown source table "
                    f"'{rel.source_table}'.",
                )
            )
        elif src_col not in columns_by_table[src_table]:
            issues.append(
                ValidationIssue(
                    "relationship_unknown_column",
                    f"Relationship {label} references unknown column "
                    f"'{rel.source_table}.{rel.source_column}'.",
                )
            )

        if tgt_table not in columns_by_table:
            issues.append(
                ValidationIssue(
                    "relationship_unknown_table",
                    f"Relationship {label} references unknown target table "
                    f"'{rel.target_table}'.",
                )
            )
        elif tgt_col not in columns_by_table[tgt_table]:
            issues.append(
                ValidationIssue(
                    "relationship_unknown_column",
                    f"Relationship {label} references unknown column "
                    f"'{rel.target_table}.{rel.target_column}'.",
                )
            )

        if rel.relationship_type.strip().lower() not in VALID_RELATIONSHIP_TYPES:
            issues.append(
                ValidationIssue(
                    "invalid_relationship_type",
                    f"Relationship {label} has invalid type "
                    f"'{rel.relationship_type}' (expected one of: "
                    f"{', '.join(sorted(VALID_RELATIONSHIP_TYPES))}).",
                )
            )

    return issues
