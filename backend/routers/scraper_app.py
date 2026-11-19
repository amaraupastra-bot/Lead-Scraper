import io
import csv
import json
import asyncio
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select, update, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db, AsyncSessionLocal
from backend.models import Lead, Contact
from backend.connectors.manager import connector_manager
from backend.crawler.website_crawler import WebsiteCrawler
from backend.connectors.verified_lead_database import get_verified_leads
from backend.connectors.live_multi_search import live_search_leads

router = APIRouter(prefix="/api/scraper", tags=["Lead Scraper"])

class ScrapeRequest(BaseModel):
    business_niche: str
    country: str = ""
    state_province: str = ""
    city_town: str = ""
    default_tag: str = "Scraped Lead, VIP"
    directory_source: str = "All Directories Combined"
    lead_count: int = 10

class MoveToGHLRequest(BaseModel):
    lead_ids: Optional[List[str]] = None
    move_all: bool = False

@router.post("/scrape")
async def scrape_leads(req: ScrapeRequest, db: AsyncSession = Depends(get_db)):
    niche = req.business_niche.strip() or "Business Services"
    country = req.country.strip() if req.country else ""
    city = req.city_town.strip() or ""
    state = req.state_province.strip() if req.state_province else ""
    location_str = f"{city}, {state}, {country}".strip(", ")
    tag = req.default_tag or "Scraped Lead, VIP"
    count = max(1, min(req.lead_count, 100))

    # 1. Fast live directory discovery with timeout guard
    discovered = []
    try:
        disc_res = await asyncio.wait_for(
            connector_manager.execute_discovery(
                keywords=niche,
                location=location_str,
                category=niche,
                limit_per_source=count
            ),
            timeout=2.5
        )
        discovered, total, dups = disc_res
    except Exception:
        discovered = []

    # 2. Live online search & directory enrichment for exact Country & City
    enriched_leads = live_search_leads(
        niche=niche,
        city=city,
        state=state,
        country=country,
        count=count
    )

    saved_leads: List[Lead] = []

    for item in enriched_leads:
        b_name = item["business_name"]
        website = item["website"]

        # Check existing in DB
        existing_stmt = select(Lead).where(
            (Lead.business_name == b_name) |
            ((Lead.website == website) & (Lead.website.isnot(None)))
        )
        existing = (await db.execute(existing_stmt)).scalar_one_or_none()

        w_score = item.get("website_score", 38)
        priority = item.get("lead_priority", "High Priority")

        if existing:
            existing.email = item["email"]
            existing.secondary_email = item["secondary_email"]
            existing.phone = item["phone"]
            existing.ghl_tag = tag
            existing.website_score = w_score
            existing.lead_priority = priority
            saved_leads.append(existing)
        else:
            new_lead = Lead(
                business_name=b_name,
                category=item["category"],
                website=website,
                email=item["email"],
                secondary_email=item["secondary_email"],
                phone=item["phone"],
                city=item["city"],
                state=item["state"],
                country=item["country"],
                address=item["address"],
                ghl_tag=tag,
                in_ghl=False,
                source_name=req.directory_source or "All Directories Combined",
                source_url=website,
                has_website=True,
                website_score=w_score,
                lead_priority=priority,
                lead_status="New",
            )
            db.add(new_lead)
            saved_leads.append(new_lead)

    await db.commit()
    for l in saved_leads:
        await db.refresh(l)

    # Map back with owner_name and website_issue from enriched_leads
    result_list = []
    for idx, l in enumerate(saved_leads):
        meta = enriched_leads[idx] if idx < len(enriched_leads) else {}
        result_list.append({
            "id": l.id,
            "business_name": l.business_name,
            "category": l.category,
            "city": l.city,
            "state": l.state,
            "country": l.country,
            "address": l.address,
            "website": l.website,
            "email": l.email,
            "secondary_email": l.secondary_email,
            "phone": l.phone,
            "ghl_tag": l.ghl_tag,
            "in_ghl": l.in_ghl,
            "source_name": l.source_name,
            "has_website": l.has_website,
            "website_score": l.website_score,
            "lead_priority": l.lead_priority,
            "owner_name": meta.get("owner_name", "Business Owner"),
            "website_issue": meta.get("website_issue", "Mobile Viewport Unresponsive & Fails Google Usability Test"),
            "created_at": l.created_at.isoformat() if l.created_at else None,
        })

    return {
        "status": "success",
        "total_discovered": len(result_list),
        "leads": result_list
    }

@router.get("/leads")
async def get_all_scraped_leads(limit: int = 100, db: AsyncSession = Depends(get_db)):
    stmt = select(Lead).order_by(desc(Lead.created_at)).limit(limit)
    res = await db.execute(stmt)
    leads = res.scalars().all()
    return [
        {
            "id": l.id,
            "business_name": l.business_name,
            "category": l.category,
            "city": l.city,
            "state": l.state,
            "country": l.country,
            "address": l.address,
            "website": l.website,
            "email": l.email,
            "secondary_email": l.secondary_email,
            "phone": l.phone,
            "ghl_tag": l.ghl_tag,
            "in_ghl": l.in_ghl,
            "source_name": l.source_name,
            "has_website": l.has_website,
            "website_score": l.website_score,
            "lead_priority": l.lead_priority,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in leads
    ]

@router.get("/ghl-leads")
async def get_ghl_leads(db: AsyncSession = Depends(get_db)):
    stmt = select(Lead).where(Lead.in_ghl == True).order_by(desc(Lead.updated_at))
    res = await db.execute(stmt)
    leads = res.scalars().all()
    return [
        {
            "id": l.id,
            "business_name": l.business_name,
            "category": l.category,
            "city": l.city,
            "state": l.state,
            "country": l.country,
            "address": l.address,
            "website": l.website,
            "email": l.email,
            "secondary_email": l.secondary_email,
            "phone": l.phone,
            "ghl_tag": l.ghl_tag,
            "in_ghl": True,
            "source_name": l.source_name,
            "has_website": l.has_website,
            "website_score": l.website_score,
            "lead_priority": l.lead_priority,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in leads
    ]

@router.post("/move-to-ghl")
async def move_to_ghl(payload: MoveToGHLRequest, db: AsyncSession = Depends(get_db)):
    if payload.move_all:
        stmt = update(Lead).values(in_ghl=True, updated_at=datetime.now(timezone.utc))
        await db.execute(stmt)
    elif payload.lead_ids:
        stmt = update(Lead).where(Lead.id.in_(payload.lead_ids)).values(in_ghl=True, updated_at=datetime.now(timezone.utc))
        await db.execute(stmt)
    await db.commit()

    count_stmt = select(Lead).where(Lead.in_ghl == True)
    count_res = await db.execute(count_stmt)
    total_ghl = len(count_res.scalars().all())

    return {"status": "success", "total_ghl_leads": total_ghl}

@router.get("/export-csv")
async def export_csv(scope: str = "scraped", db: AsyncSession = Depends(get_db)):
    stmt = select(Lead)
    if scope == "ghl":
        stmt = stmt.where(Lead.in_ghl == True)
    stmt = stmt.order_by(desc(Lead.created_at))

    res = await db.execute(stmt)
    leads = res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Business Name", "Category", "City", "State", "Address", "Website",
        "Primary Email", "Secondary Email", "Phone", "GHL Tag", "In GHL", "Source"
    ])

    for l in leads:
        writer.writerow([
            l.business_name,
            l.category or "",
            l.city or "",
            l.state or "",
            l.address or "",
            l.website or "No Website",
            l.email or "",
            l.secondary_email or "",
            l.phone or "",
            l.ghl_tag or "Scraped Lead",
            "Yes" if l.in_ghl else "No",
            l.source_name or "Directory"
        ])

    output.seek(0)
    filename = f"leads_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/import-backup")
async def import_backup(data: List[dict], db: AsyncSession = Depends(get_db)):
    count = 0
    for item in data:
        name = item.get("business_name") or item.get("name")
        if not name:
            continue
        new_lead = Lead(
            business_name=name,
            category=item.get("category", "General"),
            website=item.get("website"),
            email=item.get("email"),
            secondary_email=item.get("secondary_email"),
            phone=item.get("phone"),
            city=item.get("city"),
            state=item.get("state"),
            address=item.get("address"),
            ghl_tag=item.get("ghl_tag", "Imported Lead"),
            in_ghl=bool(item.get("in_ghl", False)),
            has_website=bool(item.get("website")),
            source_name="Backup Import"
        )
        db.add(new_lead)
        count += 1
    await db.commit()
    return {"status": "success", "imported_count": count}
