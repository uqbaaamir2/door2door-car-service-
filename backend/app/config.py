from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "Car Services API"
    environment: str = "development"
    database_url: str
    admin_username: str = "admin"
    admin_password: str = "admin123"
    admin_token: str = "car-services-admin-token"
    customer_auth_secret: str = "change-this-customer-secret"
    cors_origins: list[str] = [
        "http://localhost:8080",
    ]

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
