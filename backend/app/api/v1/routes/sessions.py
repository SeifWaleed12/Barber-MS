import uuid
import logging
from datetime import date
from typing import Optional
from decimal import Decimal, ROUND_HALF_UP
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.session import SessionCreate, SessionResponse, HaircutResponse
from app.crud import sessions as crud
from app.crud.employees import get_employee_by_id
from app.crud.discounts import get_discount_by_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sessions", tags=["Sessions"])


def _round2(val: float) -> Decimal:
    return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate employee belongs to this owner
    employee = await get_employee_by_id(db, body.employee_id, current_user.id)
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    # Validate total_revenue == sum(price * quantity)
    calculated_revenue = sum(item.price * item.quantity for item in body.items)
    if _round2(body.total_revenue) != _round2(calculated_revenue):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"total_revenue ({body.total_revenue}) does not match sum of items ({calculated_revenue})",
        )

    # Calculate discount
    discount_amount = 0.0
    discount_id = None
    if body.discount_id:
        discount = await get_discount_by_id(db, body.discount_id, current_user.id)
        if discount is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Discount not found"
            )
        discount_id = discount.id
        if discount.type == "percentage":
            discount_amount = float(_round2(body.total_revenue * float(discount.value) / 100))
        else:
            discount_amount = float(discount.value)
        # Don't let discount exceed total
        if discount_amount > body.total_revenue:
            discount_amount = body.total_revenue

    items_dicts = [item.model_dump(mode="json") for item in body.items]
    session_obj = await crud.create_session(
        db,
        owner_id=current_user.id,
        employee_id=body.employee_id,
        session_date=body.date,
        items=items_dicts,
        total_revenue=body.total_revenue,
        discount_id=discount_id,
        discount_amount=discount_amount,
    )
    final_total = float(session_obj.total_revenue) - float(session_obj.discount_amount)
    return SessionResponse(
        id=session_obj.id,
        owner_id=session_obj.owner_id,
        employee_id=session_obj.employee_id,
        date=session_obj.date,
        items=session_obj.items,
        total_revenue=float(session_obj.total_revenue),
        discount_amount=float(session_obj.discount_amount),
        final_total=final_total,
        created_at=session_obj.created_at,
        employee_name=employee.name,
    )


@router.get("", response_model=list[SessionResponse])
async def list_sessions(
    start: date = Query(...),
    end: date = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await crud.get_sessions(db, current_user.id, start, end, skip, limit)
    return [
        SessionResponse(
            id=row.id,
            owner_id=row.owner_id,
            employee_id=row.employee_id,
            date=row.date,
            items=row.items,
            total_revenue=float(row.total_revenue),
            discount_amount=float(row.discount_amount),
            final_total=float(row.total_revenue) - float(row.discount_amount),
            created_at=row.created_at,
            employee_name=row.employee_name,
        )
        for row in rows
    ]


@router.get("/haircuts", response_model=list[HaircutResponse])
async def list_haircuts(
    employee_id: Optional[uuid.UUID] = Query(None),
    filter_date: Optional[date] = Query(None, alias="date"),
    month: Optional[str] = Query(None, min_length=7, max_length=7, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await crud.get_haircuts(db, current_user.id, employee_id, filter_date, month, skip, limit)
    return [
        HaircutResponse(
            number=skip + idx + 1,
            id=row.id,
            date=row.date,
            barber_name=row.barber_name,
            services=row.items,
            total_revenue=float(row.total_revenue),
            discount_amount=float(row.discount_amount),
            final_total=float(row.total_revenue) - float(row.discount_amount),
        )
        for idx, row in enumerate(rows)
    ]


@router.delete("/{session_id}")
async def delete_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session_obj = await crud.get_session_by_id(db, session_id, current_user.id)
    if session_obj is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )
    await crud.delete_session(db, session_obj)
    return {"message": "Session deleted"}
