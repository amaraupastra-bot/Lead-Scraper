from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import AutomationWorkflow
from backend.schemas import AutomationCreate, AutomationResponse
from backend.services.automation_service import AutomationService

router = APIRouter(prefix="/api/automation", tags=["Automation"])

@router.get("", response_model=List[AutomationResponse])
async def get_automations(db: AsyncSession = Depends(get_db)):
    stmt = select(AutomationWorkflow).order_by(desc(AutomationWorkflow.created_at))
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("", response_model=AutomationResponse)
async def create_automation(payload: AutomationCreate):
    flow = await AutomationService.create_workflow(payload.model_dump())
    return flow

@router.put("/{automation_id}", response_model=AutomationResponse)
async def update_automation(
    automation_id: str,
    payload: dict,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AutomationWorkflow).where(AutomationWorkflow.id == automation_id)
    res = await db.execute(stmt)
    flow = res.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="Automation not found")

    for k, v in payload.items():
        if hasattr(flow, k):
            setattr(flow, k, v)

    await db.commit()
    await db.refresh(flow)
    return flow

@router.post("/{automation_id}/trigger")
async def trigger_automation_now(automation_id: str):
    search_id = await AutomationService.trigger_workflow(automation_id)
    if not search_id:
        raise HTTPException(status_code=404, detail="Automation not found")
    return {"status": "triggered", "search_id": search_id}

@router.delete("/{automation_id}")
async def delete_automation(automation_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(AutomationWorkflow).where(AutomationWorkflow.id == automation_id)
    res = await db.execute(stmt)
    flow = res.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="Automation not found")
    await db.delete(flow)
    await db.commit()
    return {"status": "deleted", "id": automation_id}
