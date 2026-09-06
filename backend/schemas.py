"""Pydantic models for the schema-generation API.

Phase 3: no AI yet. The response shape here is what later phases will fill in
with a real model-generated schema.
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
    type: str
    primary_key: bool = False
    foreign_key: bool = False


class Table(BaseModel):
    name: str
    columns: list[Column]


class Relationship(BaseModel):
    from_table: str
    from_column: str
    to_table: str
    to_column: str
    type: str = "many_to_one"


class SchemaResponse(BaseModel):
    project_name: str
    tables: list[Table]
    relationships: list[Relationship] = []
