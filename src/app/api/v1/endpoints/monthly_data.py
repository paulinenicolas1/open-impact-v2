from fastapi import APIRouter

from app.services.monthly_data import get_monthly_data

router = APIRouter()


@router.get("/monthly_data")
async def read_monthly_data() -> list[dict[str, str | dict[str, str]]]:
    return get_monthly_data()
