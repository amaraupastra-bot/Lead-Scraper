from typing import Dict, Any
from backend.crawler.website_crawler import WebsiteCrawler
from backend.database import AsyncSessionLocal
from backend.models import WebsiteAudit, Lead, Contact

class AuditService:
    @staticmethod
    async def run_live_audit(url: str) -> Dict[str, Any]:
        """Runs a live real-time website audit on any public URL."""
        res = await WebsiteCrawler.crawl_and_audit(url)
        return res

    @staticmethod
    async def save_audit_as_lead(audit_result: Dict[str, Any], business_name: str, category: str = "General Business") -> str:
        """Allows user on the Website Analyzer page to save an audited website directly as a lead."""
        async with AsyncSessionLocal() as session:
            contact_data = audit_result.get("contact_data", {})
            audit_info = audit_result.get("audit", {})
            
            lead = Lead(
                business_name=business_name,
                category=category,
                website=audit_result.get("url"),
                email=contact_data.get("primary_email"),
                phone=contact_data.get("primary_phone"),
                website_score=audit_info.get("improvement_score", 0),
                lead_priority=audit_result.get("lead_priority", "Medium Priority"),
                lead_status="New",
                qualification_reasons=audit_result.get("qualification_reasons", []),
                source_name="Direct Website Analyzer",
                source_url=audit_result.get("url"),
                has_website=True,
            )
            session.add(lead)
            await session.flush()

            # Add contacts
            for c in contact_data.get("all_contacts", []):
                session.add(Contact(
                    lead_id=lead.id,
                    contact_type=c["type"],
                    contact_value=c["value"],
                    source_url=c.get("source_url"),
                    verification_status=c.get("verification_status", "Extracted")
                ))

            # Add audit record
            session.add(WebsiteAudit(
                lead_id=lead.id,
                website_url=audit_result.get("url"),
                improvement_score=audit_info.get("improvement_score", 0),
                performance_score=audit_info.get("performance_score", 0),
                accessibility_score=audit_info.get("accessibility_score", 0),
                seo_score=audit_info.get("seo_score", 0),
                mobile_status=audit_info.get("mobile_status", "Unknown"),
                broken_links=audit_info.get("broken_links", 0),
                load_time_ms=audit_info.get("load_time_ms", 0),
                has_https=audit_info.get("has_https", False),
                detected_issues=audit_info.get("detected_issues", []),
                recommendations=audit_info.get("recommendations", []),
                technologies_detected=audit_info.get("technologies_detected", []),
            ))

            await session.commit()
            return lead.id
