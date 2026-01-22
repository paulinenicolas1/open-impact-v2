from fastapi import APIRouter

from app.services.annual_data import get_annual_data

router = APIRouter()


@router.get("/annual_data")
async def read_annual_data() -> list[dict[str, str]]:
    return get_annual_data()
