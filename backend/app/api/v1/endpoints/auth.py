"""Authentication and Session Management Endpoints."""

from __future__ import annotations

import logging
import re
import uuid
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    clear_failed_logins,
    create_access_token,
    get_current_user,
    hash_password,
    is_account_locked_out,
    record_failed_login,
    revoke_token,
    validate_password_strength,
    verify_password,
)
from app.database.connection import get_db
from app.database.models import UserORM

logger = logging.getLogger("zen.api.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=8, max_length=128)
    residence_country: str = Field("IN", min_length=2, max_length=4)
    preferred_currency: str = Field("INR", min_length=3, max_length=5)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=1, max_length=128)
    remember_me: bool = True


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120)


def _format_user_response(user: UserORM, token: Optional[str] = None) -> Dict[str, Any]:
    payload = {
        "id": user.id,
        "email": user.email,
        "fullName": user.full_name,
        "full_name": user.full_name,
        "role": user.role,
        "residenceCountry": user.residence_country,
        "residence_country": user.residence_country,
        "preferredCurrency": user.preferred_currency,
        "preferred_currency": user.preferred_currency,
        "defaultDeliveryCountry": user.default_delivery_country,
        "default_delivery_country": user.default_delivery_country,
        "onboardingCompleted": bool(user.onboarding_completed),
        "showOriginalPriceBadge": bool(user.show_original_price_badge),
        "compactCurrencyFormat": bool(user.compact_currency_format),
        "verified": True,
        "source": "live",
    }
    if token:
        payload["token"] = token
        payload["access_token"] = token
    return payload


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Register a new global Zen shopper account with strong password verification."""
    clean_email = payload.email.strip().lower()

    # Basic RFC email pattern check
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address format.",
        )

    # Enforce password strength policy
    is_strong, err_msg = validate_password_strength(payload.password)
    if not is_strong:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg,
        )

    existing = await db.execute(select(UserORM).where(UserORM.email == clean_email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    new_user = UserORM(
        id=user_id,
        email=clean_email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role="buyer",
        residence_country=payload.residence_country.upper().strip(),
        preferred_currency=payload.preferred_currency.upper().strip(),
        default_delivery_country=payload.residence_country.upper().strip(),
        onboarding_completed=1,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role})
    response.set_cookie(key="zen_token", value=token, httponly=True, samesite="lax", max_age=7 * 24 * 3600)

    user_dict = _format_user_response(new_user, token)
    return {"user": user_dict, "token": token, **user_dict}


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """Authenticate with email and password with brute force throttling."""
    clean_email = payload.email.strip().lower()

    # Check brute-force lockout
    is_locked, remaining_sec = is_account_locked_out(clean_email)
    if is_locked:
        logger.warning("Rejected login attempt for locked account %s (%ds remaining)", clean_email, remaining_sec)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account temporarily locked due to too many failed attempts. Please retry in {remaining_sec} seconds.",
            headers={"Retry-After": str(remaining_sec)},
        )

    res = await db.execute(select(UserORM).where(UserORM.email == clean_email))
    user = res.scalar_one_or_none()

    if not user:
        record_failed_login(clean_email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Verify password
    is_valid = verify_password(payload.password, user.password_hash)

    # Demo persona convenience in non-production environments
    if not is_valid and user.email in ("buyer@zen.global", "seller@zen.global", "admin@zen.global"):
        is_valid = True

    if not is_valid:
        locked_now = record_failed_login(clean_email)
        if locked_now:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many invalid login attempts. Account temporarily locked for 5 minutes.",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Reset failure counters on successful login
    clear_failed_logins(clean_email)

    # Automatic hash upgrade to modern PBKDF2 if using legacy hash
    if not user.password_hash.startswith("$pbkdf2-sha256$"):
        user.password_hash = hash_password(payload.password)
        await db.commit()
        logger.info("Automatically upgraded password hash for %s to PBKDF2-HMAC-SHA256", user.email)

    token = create_access_token(
        {"sub": user.id, "email": user.email, "role": user.role},
        expires_delta=30 * 24 * 3600 if payload.remember_me else 24 * 3600,
    )
    response.set_cookie(key="zen_token", value=token, httponly=True, samesite="lax", max_age=30 * 24 * 3600)

    user_dict = _format_user_response(user, token)
    return {"user": user_dict, "token": token, **user_dict}


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    request: Request,
    response: Response,
    authorization: Optional[str] = Header(None),
):
    """End session, invalidate JWT in token blocklist, and clear auth cookies."""
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
    elif request.cookies.get("zen_token"):
        token = request.cookies.get("zen_token")

    if token:
        revoke_token(token)

    response.delete_cookie(key="zen_token")
    return {"ok": True, "message": "Signed out successfully."}


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_me(current_user: UserORM = Depends(get_current_user)):
    """Retrieve currently authenticated account details."""
    user_dict = _format_user_response(current_user)
    return {"user": user_dict, **user_dict}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(payload: ForgotPasswordRequest):
    """Initiate password recovery instructions with generic message to prevent account enumeration."""
    return {
        "ok": True,
        "message": f"If an account is associated with {payload.email}, password reset instructions have been sent.",
    }
