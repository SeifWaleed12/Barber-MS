from fastapi import APIRouter
from app.api.v1.routes import auth, employees, services, sessions, costs, reports, discounts

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(employees.router)
api_router.include_router(services.router)
api_router.include_router(sessions.router)
api_router.include_router(costs.router)
api_router.include_router(reports.router)
api_router.include_router(discounts.router)
