from typing import Dict, Any, List
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import Lead, Search

router = APIRouter(prefix="/api/overview", tags=["Overview"])

@router.get("/metrics")
async def get_overview_metrics(db: AsyncSession = Depends(get_db)):
    # 1. Total leads
    lead_count_stmt = select(func.count(Lead.id))
    lead_count = (await db.execute(lead_count_stmt)).scalar() or 0

    # 2. Verified emails
    email_count_stmt = select(func.count(Lead.id)).where(Lead.email.isnot(None))
    verified_emails = (await db.execute(email_count_stmt)).scalar() or 0

    # 3. Businesses without websites
    no_web_stmt = select(func.count(Lead.id)).where(Lead.has_website == False)
    without_websites = (await db.execute(no_web_stmt)).scalar() or 0

    # 4. Outdated websites (improvement score >= 40)
    outdated_stmt = select(func.count(Lead.id)).where(Lead.website_score >= 40)
    outdated_websites = (await db.execute(outdated_stmt)).scalar() or 0

    # 5. High-Priority Leads
    high_priority_stmt = select(func.count(Lead.id)).where(Lead.lead_priority == "High Priority")
    high_priority_leads = (await db.execute(high_priority_stmt)).scalar() or 0

    # 6. Total Searches
    search_count_stmt = select(func.count(Search.id))
    total_searches = (await db.execute(search_count_stmt)).scalar() or 0

    # 7. Distribution by priority
    priority_stmt = select(Lead.lead_priority, func.count(Lead.id)).group_by(Lead.lead_priority)
    priority_res = (await db.execute(priority_stmt)).all()
    priority_dist = {r[0]: r[1] for r in priority_res}

    # 8. Distribution by status
    status_stmt = select(Lead.lead_status, func.count(Lead.id)).group_by(Lead.lead_status)
    status_res = (await db.execute(status_stmt)).all()
    status_dist = {r[0]: r[1] for r in status_res}

    # 9. Distribution by category (top 6)
    cat_stmt = select(Lead.category, func.count(Lead.id)).group_by(Lead.category).order_by(desc(func.count(Lead.id))).limit(6)
    cat_res = (await db.execute(cat_stmt)).all()
    category_dist = {r[0] or "General": r[1] for r in cat_res}

    # 10. Distribution by country
    country_stmt = select(Lead.country, func.count(Lead.id)).group_by(Lead.country).limit(6)
    country_res = (await db.execute(country_stmt)).all()
    country_dist = {r[0] or "United States": r[1] for r in country_res}

    # 11. Website quality brackets
    # 0-25 (Modern/Healthy), 26-45 (Moderate Flaws), 46-70 (Substantial Redesign Need), 71-100 (Critical/No Site)
    leads_all_stmt = select(Lead.website_score, Lead.created_at)
    all_scores_res = (await db.execute(leads_all_stmt)).all()

    quality_dist = {
        "Modern (0-25)": 0,
        "Moderate Flaws (26-45)": 0,
        "Needs Redesign (46-70)": 0,
        "Critical / No Website (71-100)": 0,
    }

    # Leads over time (past 7 days or accumulated)
    daily_counts = defaultdict(int)
    for score, created_at in all_scores_res:
        if score is None:
            score = 0
        if score <= 25:
            quality_dist["Modern (0-25)"] += 1
        elif score <= 45:
            quality_dist["Moderate Flaws (26-45)"] += 1
        elif score <= 70:
            quality_dist["Needs Redesign (46-70)"] += 1
        else:
            quality_dist["Critical / No Website (71-100)"] += 1

        day_label = created_at.strftime("%b %d") if created_at else "Today"
        daily_counts[day_label] += 1

    leads_over_time = [
        {"date": date_str, "leads": count}
        for date_str, count in daily_counts.items()
    ]
    if not leads_over_time:
        leads_over_time = [{"date": "Today", "leads": lead_count}]

    # Recent leads
    recent_leads_stmt = select(Lead).order_by(desc(Lead.created_at)).limit(5)
    recent_leads_res = (await db.execute(recent_leads_stmt)).scalars().all()

    # Recent searches
    recent_searches_stmt = select(Search).order_by(desc(Search.created_at)).limit(5)
    recent_searches_res = (await db.execute(recent_searches_stmt)).scalars().all()

    return {
        "total_leads": lead_count,
        "verified_emails": verified_emails,
        "without_websites": without_websites,
        "outdated_websites": outdated_websites,
        "high_priority_leads": high_priority_leads,
        "total_searches": total_searches,
        "leads_by_priority": priority_dist,
        "leads_by_status": status_dist,
        "leads_by_category": category_dist,
        "leads_by_country": country_dist,
        "website_quality_distribution": quality_dist,
        "leads_over_time": leads_over_time,
        "recent_leads": [
            {
                "id": l.id,
                "business_name": l.business_name,
                "category": l.category,
                "city": l.city,
                "website": l.website,
                "email": l.email,
                "phone": l.phone,
                "website_score": l.website_score,
                "lead_priority": l.lead_priority,
                "lead_status": l.lead_status,
                "created_at": l.created_at,
            }
            for l in recent_leads_res
        ],
        "recent_searches": [
            {
                "id": s.id,
                "search_name": s.search_name,
                "keywords": s.keywords,
                "location": s.location,
                "status": s.status,
                "total_discovered": s.total_discovered,
                "total_qualified": s.total_qualified,
                "progress": s.progress,
                "created_at": s.created_at,
            }
            for s in recent_searches_res
        ]
    }
