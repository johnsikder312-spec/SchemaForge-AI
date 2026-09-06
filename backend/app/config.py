"""Application configuration, loaded from environment / backend/.env.

The Anthropic API key lives here and is only ever read on the backend.
It is never sent to the frontend.
"""

import os
from functools import lru_cache

from dotenv import load_dotenv

# Load backend/.env (two levels up from this file) if present.
load_dotenv()


class Settings:
    def __init__(self) -> None:
        self.anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "").strip()
        self.ai_model: str = os.getenv("AI_MODEL", "claude-opus-5").strip()
        # Project persistence. Empty -> persistence is disabled and the
        # /projects endpoints return 503; the rest of the API is unaffected.
        self.database_url: str = os.getenv("DATABASE_URL", "").strip()
        self.frontend_origins: list[str] = [
            origin.strip()
            for origin in os.getenv(
                "FRONTEND_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173",
            ).split(",")
            if origin.strip()
        ]

    @property
    def ai_configured(self) -> bool:
        return bool(self.anthropic_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
