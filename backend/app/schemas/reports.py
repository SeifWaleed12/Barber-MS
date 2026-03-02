import uuid
from pydantic import BaseModel
from typing import List, Optional


class TopBarber(BaseModel):
    name: str
    revenue: float


class DashboardResponse(BaseModel):
    today_revenue: float
    today_profit: float
    month_revenue: float
    last_month_revenue: float
    top_barber: Optional[TopBarber] = None


class BarberBreakdown(BaseModel):
    employee_id: uuid.UUID
    name: str
    revenue: float
    sessions_count: int


class MonthlyReportResponse(BaseModel):
    revenue: float
    total_salaries: float
    costs: float
    net_profit: float
    barber_breakdown: List[BarberBreakdown]
