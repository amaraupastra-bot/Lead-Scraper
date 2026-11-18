from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.services.audit_service import AuditService

router = APIRouter(prefix="/api/analyzer", tags=["Analyzer"])

class LiveAuditRequest(BaseModel):
    url: str

class SaveAuditLeadRequest(BaseModel):
    audit_data: Dict[str, Any]
    business_name: str
    category: Optional[str] = "Web Design Prospect"

@router.post("/run")
async def run_audit(payload: LiveAuditRequest):
    if not payload.url:
        raise HTTPException(status_code=400, detail="Website URL is required")
    res = await AuditService.run_live_audit(payload.url)
    return res

@router.post("/save-lead")
async def save_audit_lead(payload: SaveAuditLeadRequest):
    lead_id = await AuditService.save_audit_as_lead(
        audit_result=payload.audit_data,
        business_name=payload.business_name,
        category=payload.category or "Prospect"
    )
    return {"status": "saved", "lead_id": lead_id}
