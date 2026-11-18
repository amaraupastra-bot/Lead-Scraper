import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import ExportRecord
from backend.schemas import ExportRequest, ExportResponse
from backend.services.export_service import ExportService, EXPORTS_DIR

router = APIRouter(prefix="/api/export", tags=["Export"])

@router.post("", response_model=ExportResponse)
async def create_export(payload: ExportRequest):
    export_result = await ExportService.generate_export(
        format_type=payload.format,
        lead_ids=payload.lead_ids,
        lead_priority=payload.lead_priority,
        lead_status=payload.lead_status,
        category=payload.category,
        country=payload.country,
        only_without_websites=payload.only_without_websites,
        only_outdated_websites=payload.only_outdated_websites,
    )
    return export_result

@router.get("/history")
async def get_export_history(db: AsyncSession = Depends(get_db)):
    stmt = select(ExportRecord).order_by(desc(ExportRecord.created_at)).limit(20)
    res = await db.execute(stmt)
    exports = res.scalars().all()
    return [
        {
            "id": e.id,
            "file_name": e.file_name,
            "format": e.format,
            "row_count": e.row_count,
            "download_url": f"/api/export/download/{e.file_name}",
            "created_at": e.created_at,
        }
        for e in exports
    ]

@router.get("/download/{filename}")
async def download_export_file(filename: str):
    safe_filename = os.path.basename(filename)
    filepath = os.path.join(EXPORTS_DIR, safe_filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Export file not found")
    
    media_type = (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        if filename.endswith(".xlsx") else "text/csv"
    )
    return FileResponse(filepath, media_type=media_type, filename=safe_filename)
