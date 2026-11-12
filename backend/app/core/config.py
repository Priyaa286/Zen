from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings and environment configuration.
    Loads variables from .env file or environment variables.
    """
    # Application metadata
    APP_NAME: str = "Zen Cross-Border Shopping Agent"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # API Prefix
    API_V1_STR: str = "/api/v1"

    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS settings (React / Vite frontend support)
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Ollama AI Configuration (Phase 2)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "zen-fast"
    OLLAMA_TIMEOUT: float = 60.0
    OLLAMA_THINK: bool = False

    # Channel3 Configuration (Phase 3)
    CHANNEL3_API_KEY: str = ""
    CHANNEL3_BASE_URL: str = "https://api.trychannel3.com"
    CHANNEL3_TIMEOUT: float = 30.0

    # FX / Exchange Rate Configuration (Phase 4)
    FX_PROVIDER_BASE_URL: str = "https://api.frankfurter.dev/v1"
    FX_PROVIDER_API_KEY: str = ""
    FX_CACHE_TTL_SECONDS: int = 3600
    FX_TIMEOUT: float = 10.0

    # PayPal Configuration (Phase 5)
    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""
    PAYPAL_BASE_URL: str = "https://api-m.sandbox.paypal.com"
    PAYPAL_WEBHOOK_ID: str = ""
    PAYPAL_MODE: str = "sandbox"

    # Database Configuration
    DATABASE_URL: str = "sqlite+aiosqlite:///./zen.db"
    MONGODB_URL: str = "mongodb://localhost:27017/zen_db"
    SQLITE_DB_PATH: str = "zen_local.db"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

