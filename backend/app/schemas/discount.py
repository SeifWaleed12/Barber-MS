import uuid
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional


class DiscountCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., pattern=r"^(percentage|fixed)$")
    value: float = Field(..., gt=0)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: float, info) -> float:
        if info.data.get("type") == "percentage" and v > 100:
            raise ValueError("Percentage discount cannot exceed 100")
        return v


class DiscountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[str] = Field(None, pattern=r"^(percentage|fixed)$")
    value: Optional[float] = Field(None, gt=0)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip()
        return v


class DiscountResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    type: str
    value: float
    created_at: datetime

    model_config = {"from_attributes": True}
