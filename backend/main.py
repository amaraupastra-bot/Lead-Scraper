import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.database import init_db
from backend.routers import (
    overview, search, leads, analyzer, sources, automation, export, scraper_app
)
from backend.services.export_service import EXPORTS_DIR

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite/PostgreSQL schema
    await init_db()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-Source Business Lead Scraping and Website Quality Analysis SaaS",
    lifespan=lifespan,
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits all local frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(overview.router)
app.include_router(search.router)
app.include_router(leads.router)
app.include_router(analyzer.router)
app.include_router(sources.router)
app.include_router(automation.router)
app.include_router(export.router)
app.include_router(scraper_app.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
