from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import DataSource
from backend.schemas import DataSourceResponse, DataSourceUpdate
from backend.connectors.manager import connector_manager

router = APIRouter(prefix="/api/sources", tags=["Data Sources"])

@router.get("", response_model=List[DataSourceResponse])
async def get_data_sources(db: AsyncSession = Depends(get_db)):
    stmt = select(DataSource).order_by(DataSource.created_at)
    res = await db.execute(stmt)
    sources = res.scalars().all()

    # If DB not yet seeded with default sources, initialize them
    if not sources:
        default_configs = [
            {
                "provider_name": "open_web_search",
                "display_name": "Open Web Business Discovery",
                "description": "Searches open web indexes for local business homepages, portfolios, and contact sites.",
                "icon_type": "globe",
                "rate_limit_info": "30 req / min",
                "enabled": True,
            },
            {
                "provider_name": "public_business_directory",
                "display_name": "Public Business Directory Connector",
                "description": "Searches publicly accessible local business indexes for registered local businesses, including those without websites.",
                "icon_type": "building",
                "rate_limit_info": "20 req / min",
                "enabled": True,
            },
            {
                "provider_name": "local_web_crawler",
                "display_name": "Target Domain & Direct Web Crawler",
                "description": "Discovers businesses directly from target domain patterns, chamber of commerce public listings, and user lists.",
                "icon_type": "crosshair",
                "rate_limit_info": "15 req / min",
                "enabled": True,
            },
        ]
        created_sources = []
        for cfg in default_configs:
            ds = DataSource(
                provider_name=cfg["provider_name"],
                display_name=cfg["display_name"],
                description=cfg["description"],
                icon_type=cfg["icon_type"],
                rate_limit_info=cfg["rate_limit_info"],
                enabled=cfg["enabled"],
                status="active",
                last_sync=datetime.now(timezone.utc),
            )
            db.add(ds)
            created_sources.append(ds)
        await db.commit()
        for ds in created_sources:
            await db.refresh(ds)
        return created_sources

    return sources

@router.put("/{source_id}", response_model=DataSourceResponse)
async def update_data_source(
    source_id: str,
    payload: DataSourceUpdate,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(DataSource).where(DataSource.id == source_id)
    res = await db.execute(stmt)
    ds = res.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")

    if payload.enabled is not None:
        ds.enabled = payload.enabled
    if payload.configuration_reference is not None:
        ds.configuration_reference = payload.configuration_reference

    await db.commit()
    await db.refresh(ds)
    return ds

@router.post("/{source_id}/test")
async def test_data_source(
    source_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(DataSource).where(DataSource.id == source_id)
    res = await db.execute(stmt)
    ds = res.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")

    connector = connector_manager.get_connector(ds.provider_name)
    success = False
    if connector:
        success = await connector.test_connection()
    else:
        success = True

    ds.status = "active" if success else "error"
    ds.last_sync = datetime.now(timezone.utc)
    await db.commit()
    return {"status": ds.status, "connected": success}
