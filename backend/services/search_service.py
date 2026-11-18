import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy import select, update
from backend.database import AsyncSessionLocal
from backend.models import Search, Lead, Contact, WebsiteAudit, DataSource
from backend.connectors.manager import connector_manager
from backend.crawler.website_crawler import WebsiteCrawler
from backend.crawler.qualification import LeadQualifier

logger = logging.getLogger("SearchService")

# In-memory tracking for pause/cancel flags
search_controllers: Dict[str, Dict[str, Any]] = {}

class SearchService:
    @staticmethod
    def get_controller(search_id: str) -> Dict[str, Any]:
        if search_id not in search_controllers:
            search_controllers[search_id] = {
                "is_paused": False,
                "is_cancelled": False,
            }
        return search_controllers[search_id]

    @staticmethod
    def pause_search(search_id: str):
        ctrl = SearchService.get_controller(search_id)
        ctrl["is_paused"] = True

    @staticmethod
    def resume_search(search_id: str):
        ctrl = SearchService.get_controller(search_id)
        ctrl["is_paused"] = False

    @staticmethod
    def cancel_search(search_id: str):
        ctrl = SearchService.get_controller(search_id)
        ctrl["is_cancelled"] = True

    @staticmethod
    async def run_search_job(search_id: str):
        """Asynchronously executes lead discovery and analysis."""
        ctrl = SearchService.get_controller(search_id)
        
        async with AsyncSessionLocal() as session:
            stmt = select(Search).where(Search.id == search_id)
            res = await session.execute(stmt)
            search = res.scalar_one_or_none()
            if not search:
                return

            search.status = "running"
            search.progress = 5
            await session.commit()

            keywords = search.keywords
            location = search.location
            category = search.category
            filters = search.filters or {}
            enabled_sources = search.active_sources or ["open_web_search", "public_business_directory"]
            max_results = filters.get("max_results", 15)

            try:
                # Stage 1: Discovery across connectors (progress 5% -> 30%)
                search.progress = 15
                await session.commit()

                discovered_list, total_raw, duplicates_count = await connector_manager.execute_discovery(
                    keywords=keywords,
                    location=location,
                    category=category,
                    enabled_sources=enabled_sources,
                    limit_per_source=max_results
                )

                search.total_discovered = len(discovered_list)
                search.duplicates_removed = duplicates_count
                search.progress = 30
                await session.commit()

                if not discovered_list:
                    search.status = "completed"
                    search.progress = 100
                    search.completed_at = datetime.now(timezone.utc)
                    await session.commit()
                    return

                total_items = len(discovered_list)
                processed = 0
                qualified = 0
                failed = 0

                # Stage 2: Crawl and Analyze each business
                for b in discovered_list:
                    # Check cancellation
                    if ctrl.get("is_cancelled"):
                        search.status = "cancelled"
                        await session.commit()
                        return

                    # Check pause
                    while ctrl.get("is_paused"):
                        search.status = "paused"
                        await session.commit()
                        await asyncio.sleep(2)
                    
                    if search.status == "paused":
                        search.status = "running"
                        await session.commit()

                    # Check if lead already exists in DB to prevent duplicates
                    existing_stmt = select(Lead).where(
                        (Lead.business_name == b.business_name) | 
                        ((Lead.website == b.website) & (Lead.website.isnot(None)))
                    )
                    existing_res = await session.execute(existing_stmt)
                    existing_lead = existing_res.scalar_one_or_none()
                    if existing_lead:
                        search.duplicates_removed += 1
                        processed += 1
                        search.total_processed = processed
                        search.progress = min(95, 30 + int((processed / total_items) * 65))
                        await session.commit()
                        continue

                    # If business has a website, crawl and analyze it
                    if b.has_website and b.website:
                        crawl_res = await WebsiteCrawler.crawl_and_audit(b.website)
                        
                        if crawl_res.get("success"):
                            contacts_info = crawl_res["contact_data"]
                            audit_info = crawl_res["audit"]
                            
                            primary_email = contacts_info.get("primary_email") or b.email
                            primary_phone = contacts_info.get("primary_phone") or b.phone
                            socials = contacts_info.get("socials", {})
                            
                            new_lead = Lead(
                                search_id=search_id,
                                business_name=b.business_name,
                                category=b.category,
                                website=b.website,
                                email=primary_email,
                                phone=primary_phone,
                                country=b.country,
                                city=b.city or location,
                                facebook=socials.get("facebook"),
                                instagram=socials.get("instagram"),
                                linkedin=socials.get("linkedin"),
                                twitter=socials.get("twitter"),
                                website_score=audit_info["improvement_score"],
                                lead_priority=crawl_res["lead_priority"],
                                lead_status="New",
                                qualification_reasons=crawl_res["qualification_reasons"],
                                source_name=b.source_name,
                                source_url=b.source_url or b.website,
                                has_website=True,
                                has_verified_email=bool(primary_email and "Verified" in [c.get("verification_status") for c in contacts_info.get("all_contacts", [])]),
                            )
                            session.add(new_lead)
                            await session.flush()

                            # Save contacts
                            for c in contacts_info.get("all_contacts", []):
                                contact_record = Contact(
                                    lead_id=new_lead.id,
                                    contact_type=c["type"],
                                    contact_value=c["value"],
                                    source_url=c.get("source_url"),
                                    verification_status=c.get("verification_status", "Extracted")
                                )
                                session.add(contact_record)

                            # Save website audit
                            audit_record = WebsiteAudit(
                                lead_id=new_lead.id,
                                website_url=b.website,
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
                            session.add(audit_record)
                            qualified += 1
                        else:
                            failed += 1
                    else:
                        # Business discovered with NO website (huge agency opportunity!)
                        priority, reasons = LeadQualifier.qualify_lead(
                            has_website=False,
                            website_score=100,
                            has_email=bool(b.email),
                            has_phone=bool(b.phone),
                            has_socials=False,
                            detected_issues=["No public business website registered or found."]
                        )

                        new_lead = Lead(
                            search_id=search_id,
                            business_name=b.business_name,
                            category=b.category,
                            website=None,
                            email=b.email,
                            phone=b.phone,
                            country=b.country,
                            city=b.city or location,
                            website_score=100,
                            lead_priority=priority,
                            lead_status="New",
                            qualification_reasons=reasons,
                            source_name=b.source_name,
                            source_url=b.source_url,
                            has_website=False,
                            has_verified_email=False,
                        )
                        session.add(new_lead)
                        await session.flush()

                        if b.phone:
                            session.add(Contact(
                                lead_id=new_lead.id,
                                contact_type="phone",
                                contact_value=b.phone,
                                source_url=b.source_url,
                                verification_status="Extracted"
                            ))
                        qualified += 1

                    processed += 1
                    search.total_processed = processed
                    search.total_qualified = qualified
                    search.failed_records = failed
                    search.progress = min(98, 30 + int((processed / total_items) * 68))
                    await session.commit()

                # Completion
                search.status = "completed"
                search.progress = 100
                search.completed_at = datetime.now(timezone.utc)
                await session.commit()

            except Exception as e:
                logger.error(f"Search job failed: {e}", exc_info=True)
                search.status = "failed"
                search.error_message = str(e)
                await session.commit()
