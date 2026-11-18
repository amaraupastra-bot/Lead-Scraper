from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc, asc, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import Lead, Contact, WebsiteAudit, LeadNote
from backend.schemas import (
    LeadResponse, LeadUpdate, LeadNoteCreate, LeadNoteResponse,
    WebsiteAuditResponse
)
from backend.crawler.website_crawler import WebsiteCrawler

router = APIRouter(prefix="/api/leads", tags=["Leads"])

@router.get("", response_model=List[LeadResponse])
async def get_leads(
    search: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    country: Optional[str] = None,
    city: Optional[str] = None,
    has_website: Optional[bool] = None,
    is_favorite: Optional[bool] = None,
    min_score: Optional[int] = None,
    max_score: Optional[int] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Lead)
        .options(
            selectinload(Lead.contacts),
            selectinload(Lead.audits),
            selectinload(Lead.notes)
        )
    )

    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(
            (Lead.business_name.ilike(search_pattern)) |
            (Lead.category.ilike(search_pattern)) |
            (Lead.city.ilike(search_pattern)) |
            (Lead.email.ilike(search_pattern)) |
            (Lead.website.ilike(search_pattern))
        )

    if priority:
        stmt = stmt.where(Lead.lead_priority == priority)
    if status:
        stmt = stmt.where(Lead.lead_status == status)
    if category:
        stmt = stmt.where(Lead.category == category)
    if country:
        stmt = stmt.where(Lead.country == country)
    if city:
        stmt = stmt.where(Lead.city == city)
    if has_website is not None:
        stmt = stmt.where(Lead.has_website == has_website)
    if is_favorite is not None:
        stmt = stmt.where(Lead.is_favorite == is_favorite)
    if min_score is not None:
        stmt = stmt.where(Lead.website_score >= min_score)
    if max_score is not None:
        stmt = stmt.where(Lead.website_score <= max_score)

    # Sorting
    sort_col = getattr(Lead, sort_by, Lead.created_at)
    if sort_dir.lower() == "asc":
        stmt = stmt.order_by(asc(sort_col))
    else:
        stmt = stmt.order_by(desc(sort_col))

    stmt = stmt.offset(skip).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Lead)
        .options(
            selectinload(Lead.contacts),
            selectinload(Lead.audits),
            selectinload(Lead.notes)
        )
        .where(Lead.id == lead_id)
    )
    res = await db.execute(stmt)
    lead = res.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    payload: LeadUpdate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Lead).where(Lead.id == lead_id)
    res = await db.execute(stmt)
    lead = res.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    update_dict = payload.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(lead, k, v)

    lead.updated_at = datetime.now(timezone.utc)
    await db.commit()
    
    # Reload with relationships loaded
    refreshed_stmt = (
        select(Lead)
        .options(
            selectinload(Lead.contacts),
            selectinload(Lead.audits),
            selectinload(Lead.notes)
        )
        .where(Lead.id == lead_id)
    )
    refreshed_lead = (await db.execute(refreshed_stmt)).scalar_one()
    return refreshed_lead

@router.delete("/{lead_id}")
async def delete_lead(lead_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Lead).where(Lead.id == lead_id)
    res = await db.execute(stmt)
    lead = res.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    await db.delete(lead)
    await db.commit()
    return {"status": "deleted", "lead_id": lead_id}

@router.post("/{lead_id}/notes", response_model=LeadNoteResponse)
async def add_lead_note(
    lead_id: str,
    payload: LeadNoteCreate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Lead).where(Lead.id == lead_id)
    res = await db.execute(stmt)
    lead = res.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    note = LeadNote(
        lead_id=lead_id,
        author_name=payload.author_name or "Agency Specialist",
        note=payload.note
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note

@router.post("/{lead_id}/analyze", response_model=WebsiteAuditResponse)
async def reanalyze_lead_website(
    lead_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Lead).where(Lead.id == lead_id)
    res = await db.execute(stmt)
    lead = res.scalar_one_or_none()
    if not lead or not lead.website:
        raise HTTPException(status_code=400, detail="Lead has no valid website to analyze")

    crawl_res = await WebsiteCrawler.crawl_and_audit(lead.website)
    if not crawl_res.get("success"):
        raise HTTPException(status_code=500, detail=f"Failed to crawl website: {crawl_res.get('error')}")

    audit_info = crawl_res["audit"]
    lead.website_score = audit_info["improvement_score"]
    lead.lead_priority = crawl_res["lead_priority"]
    lead.qualification_reasons = crawl_res["qualification_reasons"]
    
    new_audit = WebsiteAudit(
        lead_id=lead.id,
        website_url=lead.website,
        improvement_score=audit_info["improvement_score"],
        performance_score=audit_info["performance_score"],
        accessibility_score=audit_info["accessibility_score"],
        seo_score=audit_info["seo_score"],
        mobile_status=audit_info["mobile_status"],
        broken_links=audit_info["broken_links"],
        load_time_ms=audit_info["load_time_ms"],
        has_https=audit_info["has_https"],
        detected_issues=audit_info["detected_issues"],
        recommendations=audit_info["recommendations"],
        technologies_detected=audit_info["technologies_detected"],
    )
    db.add(new_audit)
    await db.commit()
    await db.refresh(new_audit)
    return new_audit
