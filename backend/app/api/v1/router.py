from fastapi import APIRouter
from app.api.v1.endpoints import (
    admin,
    agent,
    auth,
    chat,
    checkout,
    currency,
    health,
    notifications,
    payments,
    pricing,
    products,
    sellers,
    shipping,
    uploads,
    users,
)

api_router = APIRouter()

# Health
api_router.include_router(health.router, tags=["Health"])

# Media & Document Uploads
api_router.include_router(uploads.router, tags=["Media Uploads"])

# Notifications
api_router.include_router(notifications.router, tags=["Notifications"])

# Authentication & User Management
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(users.router, tags=["Users"])

# Products & Discovery
api_router.include_router(products.router, prefix="/products", tags=["Products"])

# Currency & Shipping
api_router.include_router(currency.router, tags=["Currency"])
api_router.include_router(shipping.router, tags=["Shipping"])

# Landed Cost Quotes & Checkout
api_router.include_router(pricing.router, prefix="/pricing", tags=["Pricing & Quotes"])
api_router.include_router(checkout.router, tags=["Checkout"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])

# AI Shopping Agent
api_router.include_router(agent.router, prefix="/agent", tags=["AI Agent Orchestration"])
api_router.include_router(chat.router, tags=["Chat"])

# Multi-Vendor Merchant & Admin Compliance
api_router.include_router(sellers.router, tags=["Multi-Vendor Seller Portal"])
api_router.include_router(admin.router, tags=["Admin Compliance"])
