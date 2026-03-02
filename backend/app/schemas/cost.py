import uuid
import re
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional


class CostCreate(BaseModel):
    type: str = Field(..., description="fixed or variable")
    month: Optional[str] = Field(None, min_length=7, max_length=7)
    label: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0)

    @field_validator("month")
    @classmethod
    def validate_month_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", v):
            raise ValueError("month must be in YYYY-MM format")
        return v

    @field_validator("label", "type")
    @classmethod
    def strip_strings(cls, v: str) -> str:
        return v.strip()


class CostResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    type: str
    month: Optional[str] = None
    label: str
    amount: float
    created_at: datetime

    model_config = {"from_attributes": True}
