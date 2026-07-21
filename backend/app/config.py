from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized app settings, loaded from environment variables / .env"""

    DATABASE_URL: str = "postgresql://servio:servio_dev_pw@localhost:5432/servio_db"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- OpenRouter (AI Assistant) ---
    # Get a key at https://openrouter.ai/keys and put it in backend/.env
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "openai/gpt-4o-mini"
    OPENROUTER_TIMEOUT_SECONDS: float = 30.0
    # Sent as HTTP-Referer / X-Title to OpenRouter (used for their dashboard attribution)
    OPENROUTER_SITE_URL: str = "http://localhost:3000"
    OPENROUTER_APP_NAME: str = "Servio"

    # Backwards-compat: if an old deployment still sets AI_API_KEY, use it as a
    # fallback when OPENROUTER_API_KEY is not provided.
    AI_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def openrouter_key(self) -> str:
        """The effective OpenRouter key, preferring the new var over the legacy one."""
        return self.OPENROUTER_API_KEY or self.AI_API_KEY


settings = Settings()
