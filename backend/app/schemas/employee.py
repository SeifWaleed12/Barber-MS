import uuid
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from typing import Optional


class EmployeeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    salary: float = Field(..., gt=0)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class EmployeeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    salary: Optional[float] = Field(None, gt=0)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip()
        return v


class EmployeeResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    salary: float
    created_at: datetime

    model_config = {"from_attributes": True}
