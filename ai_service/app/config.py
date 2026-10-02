from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Required: Injected via cloud dashboard or local .env
    GEMINI_API_KEY: str

    # Gemini Models
    GEMINI_MODEL: str = "gemini-2.5-flash"
    EMBEDDING_MODEL: str = "models/text-embedding-004"

    # Optional internal security token
    INTERNAL_SECRET: str | None = None

    # Server runtime (Pydantic automatically reads cloud-injected PORT)
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Wildcard allows calls from Vercel frontend, Render backend, or local dev
    ALLOWED_ORIGINS: List[str] = ["*"]

    # Safe config: reads system environment variables in production, falls back to .env
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()