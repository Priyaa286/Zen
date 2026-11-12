from fastapi import APIRouter
from app.api.v1.endpoints import health, chat, products, pricing, payments, agent

api_router = APIRouter()

# Register endpoint routers
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(chat.router, tags=["Chat"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(pricing.router, prefix="/pricing", tags=["Pricing & Quotes"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments & Checkout"])
api_router.include_router(agent.router, prefix="/agent", tags=["AI Agent Orchestration"])
