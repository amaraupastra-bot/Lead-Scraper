import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy import select
from backend.database import AsyncSessionLocal
from backend.models import AutomationWorkflow, Search
from backend.services.search_service import SearchService

class AutomationService:
    @staticmethod
    async def create_workflow(data: Dict[str, Any]) -> AutomationWorkflow:
        async with AsyncSessionLocal() as session:
            now = datetime.now(timezone.utc)
            delta = timedelta(days=1) if data.get("schedule") == "Daily" else timedelta(days=7)
            
            flow = AutomationWorkflow(
                name=data["name"],
                category=data["category"],
                location=data["location"],
                schedule=data.get("schedule", "Weekly"),
                max_results=data.get("max_results", 25),
                data_sources=data.get("data_sources", ["open_web_search", "public_business_directory"]),
                is_active=data.get("is_active", True),
                last_run=None,
                next_run=now + delta,
            )
            session.add(flow)
            await session.commit()
            await session.refresh(flow)
            return flow

    @staticmethod
    async def trigger_workflow(automation_id: str) -> Optional[str]:
        """Manually or cyclically runs the automated search workflow."""
        async with AsyncSessionLocal() as session:
            stmt = select(AutomationWorkflow).where(AutomationWorkflow.id == automation_id)
            res = await session.execute(stmt)
            flow = res.scalar_one_or_none()
            if not flow:
                return None

            # Create a corresponding Search record
            search_name = f"Auto: {flow.category} in {flow.location} ({flow.schedule})"
            search = Search(
                search_name=search_name,
                keywords=flow.category,
                location=flow.location,
                category=flow.category,
                status="queued",
                active_sources=flow.data_sources,
                filters={"max_results": flow.max_results}
            )
            session.add(search)
            
            # Update workflow timestamps
            flow.last_run = datetime.now(timezone.utc)
            delta = timedelta(days=1) if flow.schedule == "Daily" else timedelta(days=7)
            flow.next_run = flow.last_run + delta
            
            await session.commit()
            await session.refresh(search)

            # Fire off background search job
            asyncio.create_task(SearchService.run_search_job(search.id))
            return search.id
