import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.projects import router as projects_router
from app.api.routes import router
from app.config import get_settings
from app.db.base import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Set up project persistence if DATABASE_URL is configured. Failure here
    # only disables the /projects endpoints - the rest of the API still runs.
    init_db()
    yield


app = FastAPI(title="SchemaForge AI Backend", version="0.3.0", lifespan=lifespan)

# Allow the local Vite dev server(s) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(projects_router)
