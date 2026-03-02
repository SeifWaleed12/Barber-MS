import logging
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.reports import DashboardResponse, MonthlyReportResponse
from app.crud import reports as crud

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    data = await crud.get_dashboard(db, current_user.id, today)
    return data


@router.get("/monthly", response_model=MonthlyReportResponse)
async def monthly_report(
    month: str = Query(..., min_length=7, max_length=7, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await crud.get_monthly_report(db, current_user.id, month)
    return data
