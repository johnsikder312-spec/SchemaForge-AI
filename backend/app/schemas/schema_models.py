"""Pydantic models for the schema-generation API.

`SchemaResponse` is both the API response model and the structure the AI is
asked to produce; the AI output is validated against it.
"""

from pydantic import BaseModel, Field


class SchemaRequest(BaseModel):
    description: str = Field(
        ...,
        min_length=1,
        description="Natural-language description of the application idea.",
        examples=[
            "I want to build a food delivery application where users order "
            "food from restaurants."
        ],
    )


class Column(BaseModel):
    name: str
    type: str = Field(description="SQL data type, e.g. INTEGER, VARCHAR(100).")
    primary_key: bool = False
    foreign_key: bool = False


class Table(BaseModel):
    name: str
    columns: list[Column] = Field(default_factory=list)


class Relationship(BaseModel):
    source_table: str
    source_column: str
    target_table: str
    target_column: str
    relationship_type: str = Field(
        description="one_to_one | one_to_many | many_to_one | many_to_many",
    )


class SchemaResponse(BaseModel):
    project_name: str = ""
    tables: list[Table] = Field(default_factory=list)
    relationships: list[Relationship] = Field(default_factory=list)


class GeneratedSchema(SchemaResponse):
    """The API response: the validated schema plus deterministically
    generated SQL for every supported dialect. `SchemaResponse` remains the
    AI output contract."""

    sql: dict[str, str] = Field(
        default_factory=dict,
        description=(
            "Deterministically generated DDL keyed by dialect: "
            "'postgresql', 'mysql', 'sqlite'."
        ),
    )
