import os
import csv
import io
import openpyxl
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy import select
from backend.database import AsyncSessionLocal
from backend.models import Lead, ExportRecord

EXPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static_exports")
os.makedirs(EXPORTS_DIR, exist_ok=True)

class ExportService:
    @staticmethod
    async def generate_export(
        format_type: str,  # "xlsx" or "csv"
        lead_ids: Optional[List[str]] = None,
        lead_priority: Optional[str] = None,
        lead_status: Optional[str] = None,
        category: Optional[str] = None,
        country: Optional[str] = None,
        only_without_websites: bool = False,
        only_outdated_websites: bool = False,
    ) -> Dict[str, Any]:
        async with AsyncSessionLocal() as session:
            stmt = select(Lead)

            if lead_ids:
                stmt = stmt.where(Lead.id.in_(lead_ids))
            if lead_priority:
                stmt = stmt.where(Lead.lead_priority == lead_priority)
            if lead_status:
                stmt = stmt.where(Lead.lead_status == lead_status)
            if category:
                stmt = stmt.where(Lead.category == category)
            if country:
                stmt = stmt.where(Lead.country == country)
            if only_without_websites:
                stmt = stmt.where(Lead.has_website == False)
            if only_outdated_websites:
                stmt = stmt.where(Lead.website_score >= 40)

            res = await session.execute(stmt)
            leads = res.scalars().all()

            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            filename = f"leadfinder_export_{timestamp}.{format_type}"
            filepath = os.path.join(EXPORTS_DIR, filename)

            headers = [
                "Business Name", "Category", "Website", "Email", "Phone",
                "City", "State", "Country", "Facebook", "Instagram",
                "Website Score", "Lead Priority", "Lead Status",
                "Has Website", "Source Name", "Source URL", "Date Discovered"
            ]

            rows = []
            for l in leads:
                rows.append([
                    l.business_name,
                    l.category or "N/A",
                    l.website or "No Website",
                    l.email or "N/A",
                    l.phone or "N/A",
                    l.city or "",
                    l.state or "",
                    l.country or "United States",
                    l.facebook or "",
                    l.instagram or "",
                    l.website_score,
                    l.lead_priority,
                    l.lead_status,
                    "Yes" if l.has_website else "No",
                    l.source_name,
                    l.source_url or "",
                    l.created_at.strftime("%Y-%m-%d %H:%M") if l.created_at else ""
                ])

            if format_type == "csv":
                with open(filepath, mode="w", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow(headers)
                    writer.writerows(rows)
            else:
                # Excel .xlsx
                wb = openpyxl.Workbook()
                ws = wb.active
                ws.title = "LeadFinder Leads"
                ws.append(headers)
                
                # Style header
                for col in range(1, len(headers) + 1):
                    cell = ws.cell(row=1, column=col)
                    cell.font = openpyxl.styles.Font(bold=True, color="FFFFFF")
                    cell.fill = openpyxl.styles.PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")

                for r in rows:
                    ws.append(r)

                wb.save(filepath)

            # Record in DB
            export_rec = ExportRecord(
                format=format_type,
                file_name=filename,
                file_path=filepath,
                row_count=len(rows),
                filters={
                    "lead_priority": lead_priority,
                    "lead_status": lead_status,
                    "category": category,
                    "only_without_websites": only_without_websites,
                    "only_outdated_websites": only_outdated_websites,
                }
            )
            session.add(export_rec)
            await session.commit()
            await session.refresh(export_rec)

            return {
                "id": export_rec.id,
                "file_name": filename,
                "format": format_type,
                "row_count": len(rows),
                "download_url": f"/api/export/download/{filename}",
                "created_at": export_rec.created_at,
            }
