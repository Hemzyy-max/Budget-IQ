import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Budget IQ"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/budget_iq"
    FALLBACK_TO_SQLITE: bool = True
    SQLITE_URL: str = "sqlite:///./budget_iq.db"

    JWT_SECRET: str = "budget_iq_super_secret_jwt_key_for_hackathon_demo_2026_change_in_prod"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
