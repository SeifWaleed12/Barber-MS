import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.cost import CostCreate, CostResponse
from app.crud import costs as crud

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/costs", tags=["Costs"])


@router.get("", response_model=list[CostResponse])
async def list_costs(
    month: str = Query(..., min_length=7, max_length=7, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    costs = await crud.get_costs(db, current_user.id, month, skip, limit)
    return costs


@router.post("", response_model=CostResponse, status_code=status.HTTP_201_CREATED)
async def create_cost(
    body: CostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cost = await crud.create_cost(
        db,
        owner_id=current_user.id,
        month=body.month,
        type=body.type,
        label=body.label,
        amount=body.amount,
    )
    return cost


@router.delete("/{cost_id}")
async def delete_cost(
    cost_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cost = await crud.get_cost_by_id(db, cost_id, current_user.id)
    if cost is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cost not found")
    await crud.delete_cost(db, cost)
    return {"message": "Cost deleted"}
