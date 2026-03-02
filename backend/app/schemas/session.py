import uuid
from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import List, Optional


class SessionItem(BaseModel):
    service_id: uuid.UUID
    service_name: str
    price: float
    quantity: int = Field(..., ge=1)


class SessionCreate(BaseModel):
    employee_id: uuid.UUID
    date: date
    items: List[SessionItem] = Field(..., min_length=1)
    total_revenue: float = Field(..., ge=0)
    discount_id: Optional[uuid.UUID] = None


class SessionResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    employee_id: uuid.UUID
    date: date
    items: List[dict]
    total_revenue: float
    discount_amount: float = 0.0
    final_total: float = 0.0
    created_at: datetime
    employee_name: Optional[str] = None

    model_config = {"from_attributes": True}


class HaircutResponse(BaseModel):
    number: int
    id: uuid.UUID
    date: date
    barber_name: str
    services: List[dict]
    total_revenue: float
    discount_amount: float
    final_total: float
