from typing import Annotated

import structlog
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db.session import get_session
from app.models import Item, ItemCreate, ItemRead
from app.services.websocket import manager

logger = structlog.get_logger()
router = APIRouter()


@router.get("/", response_model=list[ItemRead])
async def get_items(session: Annotated[AsyncSession, Depends(get_session)]) -> list[Item]:
    result = await session.execute(select(Item))
    items = list(result.scalars().all())
    logger.info("Fetched items", count=len(items))
    return items


@router.post("/", response_model=ItemRead)
async def create_item(item: ItemCreate, session: Annotated[AsyncSession, Depends(get_session)]) -> Item:
    db_item = Item.model_validate(item)
    session.add(db_item)
    await session.commit()
    await session.refresh(db_item)

    logger.info("Item created", item_id=db_item.id, title=db_item.title)
    await manager.broadcast(f"New item added: {db_item.title}")

    return db_item
