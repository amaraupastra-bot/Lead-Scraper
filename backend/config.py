import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "LeadFinder AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./leadfinder.db"
    )
    CRAWL_TIMEOUT_SECONDS: int = int(os.getenv("CRAWL_TIMEOUT_SECONDS", "12"))
    MAX_CONCURRENT_CRAWLS: int = int(os.getenv("MAX_CONCURRENT_CRAWLS", "5"))
    USER_AGENT: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36 LeadFinderBot/1.0"
    )
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]

settings = Settings()
