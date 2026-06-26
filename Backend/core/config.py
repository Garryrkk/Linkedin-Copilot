from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "EngageIQ"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/engageiq"

    # LLM provider. core/llm.py talks to this via the OpenAI Python client,
    # since that library's request format is the de facto standard that most
    # providers (OpenAI itself, llama.cpp's llama-server.exe, koboldcpp,
    # LM Studio, Ollama, ...) implement. Set LLM_BASE_URL to point at a local
    # server instead of OpenAI; leave it blank to use the real OpenAI API.
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o"
    LLM_BASE_URL: str = ""

    # Mistral OCR
    MISTRAL_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Quality Filter
    QUALITY_MIN_SCORE: int = 40

    # Vector DB (V2)
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()