import os
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Required: Will raise an error on startup if not found in .env or system env
    GEMINI_API_KEY: str

    # Gemini Models (configurable via .env, with production defaults)
    GEMINI_MODEL: str = "gemini-2.5-flash"
    EMBEDDING_MODEL: str = "models/text-embedding-001"

    # Optional security key: Ensure only your Node.js backend can call this service
    INTERNAL_SECRET: str | None = None

    # Server runtime settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS origins: Allow React frontend and Node.js backend to connect
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite React frontend
        "http://localhost:3000",  # CRA / Next.js frontend
        "http://localhost:5000",  # Express backend
    ]

    # Configuration for loading .env file
    # Searches current directory first, then falls back to project root
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        if not os.path.exists(".env")
        else ".env",
        env_file_encoding="utf-8",
        extra="ignore",  # Ignore any extra keys in .env without crashing
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Creates and caches a single instance of the Settings object.
    Subsequent calls return the cached instance rather than re-reading the .env file.
    """
    return Settings()


# Direct instance for quick imports
settings = get_settings()