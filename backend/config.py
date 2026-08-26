from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://dealflow:dealflow@localhost:5432/dealflow"
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.0-flash"
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
