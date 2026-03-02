import uuid
import logging
from datetime import date
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.session import Session
from app.models.employee import Employee
from app.models.cost import Cost

logger = logging.getLogger(__name__)


async def get_dashboard(db: AsyncSession, owner_id: uuid.UUID, today: date):
    first_of_month = today.replace(day=1)
    if today.month == 1:
        first_of_last_month = today.replace(year=today.year - 1, month=12, day=1)
    else:
        first_of_last_month = today.replace(month=today.month - 1, day=1)
    last_day_of_last_month = first_of_month

    # Today's revenue
    today_stmt = select(
        func.coalesce(func.sum(Session.total_revenue - Session.discount_amount), 0).label("revenue"),
    ).where(Session.owner_id == owner_id, Session.date == today)
    today_result = await db.execute(today_stmt)
    today_revenue = float(today_result.scalar_one())

    # Today's costs + salaries for profit estimate
    month_str = today.strftime("%Y-%m")
    costs_stmt = select(
        func.coalesce(func.sum(Cost.amount), 0)
    ).where(
        (Cost.owner_id == owner_id) & 
        ((Cost.month == month_str) | (Cost.month.is_(None)) | (Cost.type == 'fixed'))
    )
    costs_result = await db.execute(costs_stmt)
    monthly_costs = float(costs_result.scalar_one())

    salaries_stmt = select(
        func.coalesce(func.sum(Employee.salary), 0)
    ).where(Employee.owner_id == owner_id)
    salaries_result = await db.execute(salaries_stmt)
    total_salaries = float(salaries_result.scalar_one())

    # Current month revenue
    month_stmt = select(
        func.coalesce(func.sum(Session.total_revenue - Session.discount_amount), 0).label("revenue")
    ).where(
        Session.owner_id == owner_id,
        Session.date >= first_of_month,
        Session.date <= today,
    )
    month_result = await db.execute(month_stmt)
    month_revenue = float(month_result.scalar_one())

    # Today profit = today_revenue (daily share of monthly expenses)
    # Salary is now bi-weekly (14 days), so daily salary cost is total_salaries / 14
    days_in_month = (date(today.year, today.month % 12 + 1, 1) - first_of_month).days if today.month < 12 else 31
    daily_cost_expenses = monthly_costs / days_in_month if days_in_month > 0 else 0
    daily_salary_expenses = total_salaries / 14
    daily_expenses = daily_cost_expenses + daily_salary_expenses
    
    today_profit = today_revenue - daily_expenses

    # Last month revenue
    last_month_stmt = select(
        func.coalesce(func.sum(Session.total_revenue - Session.discount_amount), 0).label("revenue")
    ).where(
        Session.owner_id == owner_id,
        Session.date >= first_of_last_month,
        Session.date < last_day_of_last_month,
    )
    last_month_result = await db.execute(last_month_stmt)
    last_month_revenue = float(last_month_result.scalar_one())

    # Top barber current month
    top_barber_stmt = (
        select(
            Employee.name,
            func.coalesce(func.sum(Session.total_revenue - Session.discount_amount), 0).label("revenue"),
        )
        .join(Employee, Session.employee_id == Employee.id)
        .where(
            Session.owner_id == owner_id,
            Session.date >= first_of_month,
            Session.date <= today,
        )
        .group_by(Employee.id, Employee.name)
        .order_by(func.sum(Session.total_revenue - Session.discount_amount).desc())
        .limit(1)
    )
    top_barber_result = await db.execute(top_barber_stmt)
    top_barber_row = top_barber_result.one_or_none()

    top_barber = None
    if top_barber_row:
        top_barber = {"name": top_barber_row.name, "revenue": float(top_barber_row.revenue)}

    return {
        "today_revenue": today_revenue,
        "today_profit": round(today_profit, 2),
        "month_revenue": month_revenue,
        "last_month_revenue": last_month_revenue,
        "top_barber": top_barber,
    }


async def get_monthly_report(db: AsyncSession, owner_id: uuid.UUID, month: str):
    year, mon = int(month[:4]), int(month[5:7])
    start_date = date(year, mon, 1)
    if mon == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, mon + 1, 1)

    # Revenue (after discounts)
    revenue_stmt = select(
        func.coalesce(func.sum(Session.total_revenue - Session.discount_amount), 0).label("revenue"),
    ).where(
        Session.owner_id == owner_id,
        Session.date >= start_date,
        Session.date < end_date,
    )
    revenue_result = await db.execute(revenue_stmt)
    revenue = float(revenue_result.scalar_one())

    # Total salaries (bi-weekly)
    salaries_stmt = select(
        func.coalesce(func.sum(Employee.salary), 0)
    ).where(Employee.owner_id == owner_id)
    salaries_result = await db.execute(salaries_stmt)
    biweekly_salaries = float(salaries_result.scalar_one())
    
    days_in_month = (end_date - start_date).days
    total_salaries = (biweekly_salaries / 14) * days_in_month

    # Costs: Fixed costs (month is null) + Variable costs (month == this month)
    costs_stmt = select(
        func.coalesce(func.sum(Cost.amount), 0).label("total_costs")
    ).where(
        (Cost.owner_id == owner_id) & 
        ((Cost.month == month) | (Cost.month.is_(None)) | (Cost.type == 'fixed'))
    )
    costs_result = await db.execute(costs_stmt)
    total_costs = float(costs_result.scalar_one())

    net_profit = revenue - total_salaries - total_costs

    # Barber breakdown
    barber_stmt = (
        select(
            Employee.id.label("employee_id"),
            Employee.name,
            func.coalesce(func.sum(Session.total_revenue - Session.discount_amount), 0).label("revenue"),
            func.count(Session.id).label("sessions_count"),
        )
        .join(Employee, Session.employee_id == Employee.id)
        .where(
            Session.owner_id == owner_id,
            Session.date >= start_date,
            Session.date < end_date,
        )
        .group_by(Employee.id, Employee.name)
        .order_by(func.sum(Session.total_revenue - Session.discount_amount).desc())
    )
    barber_result = await db.execute(barber_stmt)
    barber_breakdown = [
        {
            "employee_id": row.employee_id,
            "name": row.name,
            "revenue": float(row.revenue),
            "sessions_count": row.sessions_count,
        }
        for row in barber_result.all()
    ]

    return {
        "revenue": revenue,
        "total_salaries": total_salaries,
        "costs": total_costs,
        "net_profit": net_profit,
        "barber_breakdown": barber_breakdown,
    }
