import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import Column, SchemaRequest, SchemaResponse, Table

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("schemaforge")

app = FastAPI(title="SchemaForge AI Backend", version="0.1.0")

# Allow the local Vite dev server to call the API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def build_dummy_schema(description: str) -> SchemaResponse:
    """Return a fixed placeholder schema.

    Phase 3 stand-in for real AI generation. The `description` is only logged
    for now so the end-to-end flow can be verified.
    """
    logger.info("Building dummy schema for description: %r", description)
    return SchemaResponse(
        project_name="Example Project",
        tables=[
            Table(
                name="users",
                columns=[
                    Column(name="id", type="INTEGER", primary_key=True),
                    Column(name="name", type="VARCHAR(100)"),
                    Column(name="email", type="VARCHAR(100)"),
                ],
            )
        ],
        relationships=[],
    )


@app.get("/")
def read_root():
    return {"message": "SchemaForge AI Backend Running"}


@app.post("/generate-schema", response_model=SchemaResponse)
def generate_schema(payload: SchemaRequest) -> SchemaResponse:
    try:
        return build_dummy_schema(payload.description)
    except Exception:  # noqa: BLE001 - log anything unexpected, then 500
        logger.exception("Failed to generate schema")
        raise HTTPException(
            status_code=500, detail="Failed to generate schema."
        )
