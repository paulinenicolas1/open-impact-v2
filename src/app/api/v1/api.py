from fastapi import APIRouter

from app.api.v1.endpoints import annual_data, chat, items, monthly_data

api_router = APIRouter()
api_router.include_router(items.router, prefix="/items", tags=["items"])
api_router.include_router(chat.router, tags=["chat"])
api_router.include_router(annual_data.router, tags=["annual-data"])
api_router.include_router(monthly_data.router, tags=["monthly-data"])
