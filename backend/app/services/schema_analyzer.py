"""Read-only schema analysis.

Given a schema, report likely problems grouped by severity
(error / warning / suggestion). This never modifies the schema and is
independent of schema generation and validation - it is a separate advisory
pass the user can act on manually.

Checks:
  - missing / composite primary keys
  - duplicate columns
  - invalid or unlinked foreign keys
  - unused / duplicate / unreflected relationships, isolated tables
  - potentially redundant data (repeated columns, identical tables)
  - basic normalization issues (list columns, repeating groups,
    many-to-many without a junction table, very wide tables)
"""

import re
from collections import Counter, defaultdict

from pydantic import BaseModel

from app.schemas.schema_models import SchemaResponse

_REPEATING_GROUP_RE = re.compile(r"^(.*?)(\d+)$")
_LIST_COLUMN_RE = re.compile(r"_(list|csv|array|ids|tags|values)$")
_WIDE_TABLE_COLUMNS = 15
_REPEATED_COLUMN_MIN_TABLES = 3

_SEVERITIES = ("error", "warning", "suggestion")


class AnalysisFinding(BaseModel):
    category: str  # "error" | "warning" | "suggestion"
    code: str
    title: str
    explanation: str
    table: str | None = None
    solution: str


class AnalysisResult(BaseModel):
    findings: list[AnalysisFinding]
    counts: dict[str, int]


def _norm_type(raw: str) -> str:
    return " ".join(raw.strip().lower().split())


def analyze_schema(schema: SchemaResponse) -> AnalysisResult:
    findings: list[AnalysisFinding] = []
    tables = schema.tables
    table_names = {t.name for t in tables}
    table_by_name = {t.name: t for t in tables}
    columns_by_table: dict[str, dict[str, str]] = {
        t.name: {c.name: c.type for c in t.columns} for t in tables
    }

    # ---- per-table checks -------------------------------------------------
    for table in tables:
        pk_cols = [c for c in table.columns if c.primary_key]

        if not pk_cols:
            findings.append(
                AnalysisFinding(
                    category="error",
                    code="missing_primary_key",
                    title="Table has no primary key",
                    explanation=(
                        f"'{table.name}' has no primary key column, so its rows "
                        "cannot be uniquely identified or safely referenced."
                    ),
                    table=table.name,
                    solution=(
                        "Add a primary key column (for example an "
                        "auto-incrementing 'id')."
                    ),
                )
            )
        elif len(pk_cols) > 1:
            names = ", ".join(c.name for c in pk_cols)
            findings.append(
                AnalysisFinding(
                    category="warning",
                    code="composite_primary_key",
                    title="Composite primary key",
                    explanation=(
                        f"'{table.name}' marks {len(pk_cols)} columns as primary "
                        f"key ({names}). This is valid for join tables but is "
                        "often a mistake."
                    ),
                    table=table.name,
                    solution=(
                        "Confirm the composite key is intended; otherwise keep a "
                        "single primary key and make the others regular columns."
                    ),
                )
            )

        # duplicate columns
        seen: dict[str, int] = Counter(c.name.lower() for c in table.columns)
        for name, n in seen.items():
            if n > 1:
                findings.append(
                    AnalysisFinding(
                        category="error",
                        code="duplicate_column",
                        title="Duplicate column",
                        explanation=(
                            f"'{table.name}' defines a column named '{name}' "
                            f"{n} times."
                        ),
                        table=table.name,
                        solution="Remove or rename the duplicate column.",
                    )
                )

        # wide table
        if len(table.columns) > _WIDE_TABLE_COLUMNS:
            findings.append(
                AnalysisFinding(
                    category="suggestion",
                    code="wide_table",
                    title="Very wide table",
                    explanation=(
                        f"'{table.name}' has {len(table.columns)} columns. Wide "
                        "tables often mix several concerns."
                    ),
                    table=table.name,
                    solution=(
                        "Consider splitting rarely-used or logically separate "
                        "columns into their own table."
                    ),
                )
            )

        # 1NF: list-like columns
        for column in table.columns:
            if _LIST_COLUMN_RE.search(column.name.lower()):
                findings.append(
                    AnalysisFinding(
                        category="suggestion",
                        code="list_column",
                        title="Column may store multiple values",
                        explanation=(
                            f"'{table.name}.{column.name}' looks like it holds a "
                            "list of values in one field, which breaks first "
                            "normal form."
                        ),
                        table=table.name,
                        solution=(
                            "Move the repeated values into a separate table with "
                            f"one row per value linked back to '{table.name}'."
                        ),
                    )
                )

        # repeating groups: phone_1, phone_2 / address_line_1, address_line_2
        prefixes: dict[str, list[str]] = defaultdict(list)
        for column in table.columns:
            match = _REPEATING_GROUP_RE.match(column.name)
            if match and match.group(1).strip("_"):
                prefixes[match.group(1)].append(column.name)
        for prefix, cols in prefixes.items():
            if len(cols) > 1:
                findings.append(
                    AnalysisFinding(
                        category="suggestion",
                        code="repeating_group",
                        title="Repeating group of columns",
                        explanation=(
                            f"'{table.name}' has numbered columns "
                            f"({', '.join(sorted(cols))}) that repeat the same "
                            "attribute."
                        ),
                        table=table.name,
                        solution=(
                            f"Replace them with a related table (e.g. "
                            f"'{prefix.strip('_')}s') holding one row per value."
                        ),
                    )
                )

    # ---- foreign keys ---------------------------------------------------
    rel_sources = {
        (r.source_table, r.source_column) for r in schema.relationships
    }
    for table in tables:
        for column in table.columns:
            if column.foreign_key and (table.name, column.name) not in rel_sources:
                findings.append(
                    AnalysisFinding(
                        category="error",
                        code="unlinked_foreign_key",
                        title="Foreign key with no relationship",
                        explanation=(
                            f"'{table.name}.{column.name}' is marked as a foreign "
                            "key but no relationship says what it references."
                        ),
                        table=table.name,
                        solution=(
                            "Add a relationship for this column, or clear its "
                            "foreign-key flag."
                        ),
                    )
                )

    # ---- relationships ------------------------------------------------
    rel_pair_counts: Counter = Counter()
    connected_tables: set[str] = set()

    for rel in schema.relationships:
        label = (
            f"{rel.source_table}.{rel.source_column} -> "
            f"{rel.target_table}.{rel.target_column}"
        )
        rel_pair_counts[
            (rel.source_table, rel.source_column, rel.target_table, rel.target_column)
        ] += 1
        connected_tables.add(rel.source_table)
        connected_tables.add(rel.target_table)

        src_cols = columns_by_table.get(rel.source_table)
        tgt_cols = columns_by_table.get(rel.target_table)

        if src_cols is None or tgt_cols is None:
            missing = rel.source_table if src_cols is None else rel.target_table
            findings.append(
                AnalysisFinding(
                    category="error",
                    code="relationship_unknown_table",
                    title="Relationship points at a missing table",
                    explanation=(
                        f"Relationship {label} references table '{missing}', "
                        "which does not exist."
                    ),
                    table=rel.source_table if rel.source_table in table_names else None,
                    solution="Fix the table name or remove the relationship.",
                )
            )
            continue

        if rel.source_column not in src_cols:
            findings.append(
                AnalysisFinding(
                    category="error",
                    code="relationship_unknown_column",
                    title="Relationship points at a missing column",
                    explanation=(
                        f"Relationship {label} references "
                        f"'{rel.source_table}.{rel.source_column}', which does "
                        "not exist."
                    ),
                    table=rel.source_table,
                    solution="Fix the column name or remove the relationship.",
                )
            )
            continue
        if rel.target_column not in tgt_cols:
            findings.append(
                AnalysisFinding(
                    category="error",
                    code="relationship_unknown_column",
                    title="Relationship points at a missing column",
                    explanation=(
                        f"Relationship {label} references "
                        f"'{rel.target_table}.{rel.target_column}', which does "
                        "not exist."
                    ),
                    table=rel.target_table,
                    solution="Fix the column name or remove the relationship.",
                )
            )
            continue

        # source column not flagged as a foreign key
        source_column = next(
            c for c in table_by_name[rel.source_table].columns
            if c.name == rel.source_column
        )
        if not source_column.foreign_key:
            findings.append(
                AnalysisFinding(
                    category="warning",
                    code="relationship_not_reflected",
                    title="Relationship not marked as a foreign key",
                    explanation=(
                        f"Relationship {label} exists but "
                        f"'{rel.source_table}.{rel.source_column}' is not marked "
                        "as a foreign key."
                    ),
                    table=rel.source_table,
                    solution=(
                        f"Mark '{rel.source_table}.{rel.source_column}' as a "
                        "foreign key so tools and SQL treat it consistently."
                    ),
                )
            )

        # type mismatch between FK and referenced column
        src_type = _norm_type(src_cols[rel.source_column])
        tgt_type = _norm_type(tgt_cols[rel.target_column])
        if src_type != tgt_type:
            findings.append(
                AnalysisFinding(
                    category="warning",
                    code="foreign_key_type_mismatch",
                    title="Foreign key type does not match its target",
                    explanation=(
                        f"{rel.source_table}.{rel.source_column} is "
                        f"'{src_cols[rel.source_column]}' but "
                        f"{rel.target_table}.{rel.target_column} is "
                        f"'{tgt_cols[rel.target_column]}'."
                    ),
                    table=rel.source_table,
                    solution=(
                        "Give the foreign key the same data type as the column "
                        "it references."
                    ),
                )
            )

        if rel.relationship_type == "many_to_many":
            findings.append(
                AnalysisFinding(
                    category="suggestion",
                    code="many_to_many_needs_junction",
                    title="Many-to-many relationship",
                    explanation=(
                        f"Relationship {label} is many-to-many. Relational "
                        "databases cannot store this directly."
                    ),
                    table=rel.source_table,
                    solution=(
                        f"Add a junction table (e.g. "
                        f"'{rel.source_table}_{rel.target_table}') with a "
                        "foreign key to each side."
                    ),
                )
            )

    for (st, sc, tt, tc), n in rel_pair_counts.items():
        if n > 1:
            findings.append(
                AnalysisFinding(
                    category="warning",
                    code="duplicate_relationship",
                    title="Duplicate relationship",
                    explanation=(
                        f"The relationship {st}.{sc} -> {tt}.{tc} is defined "
                        f"{n} times."
                    ),
                    table=st,
                    solution="Remove the duplicate relationship.",
                )
            )

    # isolated tables (only meaningful when there is more than one table)
    if len(tables) > 1:
        for table in tables:
            if table.name not in connected_tables:
                findings.append(
                    AnalysisFinding(
                        category="suggestion",
                        code="isolated_table",
                        title="Table is not connected to any other table",
                        explanation=(
                            f"'{table.name}' has no relationships to or from any "
                            "other table."
                        ),
                        table=table.name,
                        solution=(
                            "If it should relate to another table, add a foreign "
                            "key and relationship; otherwise this may be fine."
                        ),
                    )
                )

    # ---- potentially redundant data ----------------------------------
    # same non-key column name (and type) repeated across many tables
    column_locations: dict[str, list[str]] = defaultdict(list)
    column_types: dict[str, set[str]] = defaultdict(set)
    for table in tables:
        for column in table.columns:
            if column.primary_key or column.foreign_key:
                continue
            if column.name.lower() in {"id", "name", "created_at", "updated_at"}:
                continue
            column_locations[column.name.lower()].append(table.name)
            column_types[column.name.lower()].add(_norm_type(column.type))

    for name, locations in column_locations.items():
        if len(locations) >= _REPEATED_COLUMN_MIN_TABLES and len(column_types[name]) == 1:
            findings.append(
                AnalysisFinding(
                    category="suggestion",
                    code="repeated_column",
                    title="Same column repeated across many tables",
                    explanation=(
                        f"'{name}' appears in {len(locations)} tables "
                        f"({', '.join(sorted(locations))}) with the same type."
                    ),
                    table=None,
                    solution=(
                        "If these represent the same real-world attribute, "
                        "consider moving it into one shared table and "
                        "referencing it."
                    ),
                )
            )

    # tables with an identical set of column names
    signature_to_tables: dict[tuple, list[str]] = defaultdict(list)
    for table in tables:
        signature = tuple(sorted(c.name.lower() for c in table.columns))
        if signature:
            signature_to_tables[signature].append(table.name)
    for names in signature_to_tables.values():
        if len(names) > 1:
            findings.append(
                AnalysisFinding(
                    category="suggestion",
                    code="identical_tables",
                    title="Tables with identical structure",
                    explanation=(
                        f"Tables {', '.join(sorted(names))} have exactly the "
                        "same columns."
                    ),
                    table=None,
                    solution=(
                        "Consider merging them into one table with a 'type' "
                        "column, unless they are deliberately separate."
                    ),
                )
            )

    # De-duplicate identical findings (e.g. a duplicated relationship raising
    # the same downstream finding twice).
    seen_findings: set[tuple] = set()
    unique: list[AnalysisFinding] = []
    for finding in findings:
        key = (finding.code, finding.table, finding.explanation)
        if key not in seen_findings:
            seen_findings.add(key)
            unique.append(finding)
    findings = unique

    counts = {
        severity: sum(1 for f in findings if f.category == severity)
        for severity in _SEVERITIES
    }
    order = {s: i for i, s in enumerate(_SEVERITIES)}
    findings.sort(key=lambda f: (order[f.category], f.table or "", f.code))
    return AnalysisResult(findings=findings, counts=counts)
