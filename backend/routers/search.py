import asyncio
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import Search
from backend.schemas import SearchCreate, SearchResponse
from backend.services.search_service import SearchService

router = APIRouter(prefix="/api/search", tags=["Search"])

@router.post("", response_model=SearchResponse)
async def create_search(
    payload: SearchCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    search_name = f"{payload.keywords} in {payload.location}"
    new_search = Search(
        search_name=search_name,
        keywords=payload.keywords,
        location=payload.location,
        country=payload.country or "United States",
        category=payload.category,
        status="queued",
        progress=0,
        active_sources=payload.data_sources or ["open_web_search", "public_business_directory"],
        filters={
            "max_results": payload.max_results,
            "has_website_filter": payload.has_website_filter,
            "contact_filters": payload.contact_filters,
            "min_website_score": payload.min_website_score,
            "max_website_score": payload.max_website_score,
        }
    )
    db.add(new_search)
    await db.commit()
    await db.refresh(new_search)

    # Launch background lead discovery & analysis job
    background_tasks.add_task(SearchService.run_search_job, new_search.id)

    return new_search

@router.get("/history", response_model=List[SearchResponse])
async def get_search_history(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Search).order_by(desc(Search.created_at)).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{search_id}", response_model=SearchResponse)
async def get_search_by_id(
    search_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Search).where(Search.id == search_id)
    res = await db.execute(stmt)
    search = res.scalar_one_or_none()
    if not search:
        raise HTTPException(status_code=404, detail="Search not found")
    return search

@router.post("/{search_id}/pause")
async def pause_search_endpoint(search_id: str):
    SearchService.pause_search(search_id)
    return {"status": "paused", "search_id": search_id}

@router.post("/{search_id}/resume")
async def resume_search_endpoint(search_id: str):
    SearchService.resume_search(search_id)
    return {"status": "resumed", "search_id": search_id}

@router.post("/{search_id}/cancel")
async def cancel_search_endpoint(search_id: str):
    SearchService.cancel_search(search_id)
    return {"status": "cancelled", "search_id": search_id}
