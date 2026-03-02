import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.discount import DiscountCreate, DiscountUpdate, DiscountResponse
from app.crud import discounts as crud

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/discounts", tags=["Discounts"])


@router.get("", response_model=list[DiscountResponse])
async def list_discounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    discounts = await crud.get_discounts(db, current_user.id, skip, limit)
    return discounts


@router.post("", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
async def create_discount(
    body: DiscountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    discount = await crud.create_discount(
        db,
        owner_id=current_user.id,
        name=body.name,
        type=body.type,
        value=body.value,
    )
    return discount


@router.put("/{discount_id}", response_model=DiscountResponse)
async def update_discount(
    discount_id: uuid.UUID,
    body: DiscountUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    discount = await crud.get_discount_by_id(db, discount_id, current_user.id)
    if discount is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discount not found")
    update_data = body.model_dump(exclude_unset=True)
    updated = await crud.update_discount(db, discount, update_data)
    return updated


@router.delete("/{discount_id}")
async def delete_discount(
    discount_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    discount = await crud.get_discount_by_id(db, discount_id, current_user.id)
    if discount is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discount not found")
    await crud.delete_discount(db, discount)
    return {"message": "Discount deleted"}
