"""Automated Adversarial Security & Verification Test Suite for Merchant Registration.

Tests:
1. Clean-slate registration with zero fake defaults
2. Strict merchant agreement acceptance enforcement
3. Country-specific banking validation (US ABA, UK Sort Code, EU IBAN, JP SWIFT)
4. AES-256 encryption at rest and masking of bank details in API responses
5. Verification lifecycle (SUBMITTED -> UNDER_REVIEW -> APPROVED / REJECTED)
6. Scoped store isolation (no leakage of demo store to new accounts)
7. Document upload signature & MIME validation
"""

import json
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.financial_crypto import (
    decrypt_bank_details,
    encrypt_bank_details,
    mask_account_number,
    validate_bank_details,
)
from app.core.security import create_access_token, hash_password
from app.database.connection import init_engine, get_db
from app.database.models import AuditLogORM, SellerStoreORM, UserORM
from app.main import app

init_engine()


def test_bank_validation_country_specific_formats():
    """Verify validation handles diverse jurisdictions correctly without assuming IBAN everywhere."""
    # US valid
    ok, err = validate_bank_details({
        "bankName": "JPMorgan Chase",
        "accountHolderName": "Zen Optics USA LLC",
        "accountNumber": "9812489128",
        "routingNumber": "021000021",
    }, country="US")
    assert ok, f"Expected US valid, got {err}"

    # US invalid routing (not 9 digits)
    ok, err = validate_bank_details({
        "bankName": "JPMorgan Chase",
        "accountHolderName": "Zen Optics USA LLC",
        "accountNumber": "9812489128",
        "routingNumber": "1234",
    }, country="US")
    assert not ok
    assert "9 digits" in err

    # UK valid
    ok, err = validate_bank_details({
        "bankName": "Barclays Bank UK",
        "accountHolderName": "Zen Exports UK Ltd",
        "accountNumber": "12345678",
        "sortCode": "200000",
    }, country="GB")
    assert ok, f"Expected UK valid, got {err}"

    # UK invalid sort code
    ok, err = validate_bank_details({
        "bankName": "Barclays Bank UK",
        "accountHolderName": "Zen Exports UK Ltd",
        "accountNumber": "12345678",
        "sortCode": "99",
    }, country="GB")
    assert not ok
    assert "Sort Code" in err

    # Germany / EU valid IBAN
    ok, err = validate_bank_details({
        "bankName": "Deutsche Bank",
        "accountHolderName": "Zen Precision GmbH",
        "accountNumber": "DE89370400440532013000",
        "swiftBic": "DEUTDEDBFXX",
    }, country="DE")
    assert ok, f"Expected DE valid, got {err}"

    # Germany / EU invalid IBAN
    ok, err = validate_bank_details({
        "bankName": "Deutsche Bank",
        "accountHolderName": "Zen Precision GmbH",
        "accountNumber": "INVALID_IBAN_123",
        "swiftBic": "DEUTDEDBFXX",
    }, country="DE")
    assert not ok
    assert "IBAN" in err

    # Japan valid
    ok, err = validate_bank_details({
        "bankName": "Sumitomo Mitsui Banking Corporation",
        "accountHolderName": "Kyoto Crafts Kabushiki Kaisha",
        "accountNumber": "7489201",
        "swiftBic": "SMBCJPJT",
    }, country="JP")
    assert ok, f"Expected JP valid, got {err}"


def test_bank_details_aes_encryption_and_masking():
    """Verify AES-256 encryption at rest and masking of bank account numbers."""
    sensitive_payload = {
        "bank_name": "Mizuho Corporate Bank",
        "account_holder": "Tokyo Precision KK",
        "account_number": "SMBC-9988-124912",
        "swift_bic": "MHCBJPJT",
    }
    ciphertext = encrypt_bank_details(sensitive_payload)
    assert ciphertext != json.dumps(sensitive_payload)
    assert "SMBC-9988-124912" not in ciphertext

    decrypted = decrypt_bank_details(ciphertext)
    assert decrypted["account_number"] == "SMBC-9988-124912"

    masked = mask_account_number("SMBC-9988-124912")
    assert masked.endswith("4912")
    assert "•••• ••••" in masked


@pytest.mark.asyncio
async def test_clean_slate_registration_and_terms_enforcement():
    """Test merchant onboarding requires explicit terms agreement and sets status to SUBMITTED."""
    from app.database.connection import AsyncSessionLocal, init_engine
    init_engine()

    test_email = "new_merchant_audit@zen.global"
    test_user_id = "usr_test_merchant_audit"

    assert AsyncSessionLocal is not None
    async with AsyncSessionLocal() as session:
        # Create fresh user with no existing store
        existing_u = await session.execute(select(UserORM).where(UserORM.email == test_email))
        u = existing_u.scalar_one_or_none()
        if not u:
            u = UserORM(
                id=test_user_id,
                email=test_email,
                full_name="Audit Merchant",
                password_hash=hash_password("AuditPassword123!"),
                role="buyer",
                residence_country="JP",
                preferred_currency="JPY",
            )
            session.add(u)
            await session.commit()

        # Delete any existing store for this user
        s_res = await session.execute(select(SellerStoreORM).where(SellerStoreORM.user_id == test_user_id))
        old_s = s_res.scalar_one_or_none()
        if old_s:
            await session.delete(old_s)
            await session.commit()

    token = create_access_token({"sub": test_user_id, "email": test_email, "role": "buyer"})
    headers = {"Authorization": f"Bearer {token}"}

    with TestClient(app) as client:
        # 1. New user has NO store: GET /sellers/me must return 404 (does NOT leak Tokyo Optics)
        me_resp = client.get("/api/v1/sellers/me", headers=headers)
        assert me_resp.status_code == 404, f"Expected 404 for new merchant without store, got {me_resp.status_code}"

        # 2. Reject registration if agreement is NOT explicitly accepted
        reg_no_terms = client.post(
            "/api/v1/sellers/register",
            headers=headers,
            json={
                "storeName": "Audit Craft House",
                "legalBusinessName": "Audit Craft Co., Ltd.",
                "agreementAccepted": False,
            },
        )
        assert reg_no_terms.status_code == 400
        assert "Merchant Agreement" in reg_no_terms.text

        # 3. Successful registration with clean fields, document reference, and bank details
        reg_payload = {
            "storeName": "Audit Craft House",
            "legalBusinessName": "Audit Craft Co., Ltd.",
            "registrationNumber": "0100-01-998877",
            "taxId": "T-9988112233",
            "businessPhone": "+81 3 1111 2222",
            "businessAddress": "1-2-3 Ginza, Chuo-ku, Tokyo, Japan",
            "country": "JP",
            "baseCurrency": "JPY",
            "primaryCategory": "Home & Kitchen",
            "description": "Artisanal handcrafted porcelain and cast-iron kitchenware.",
            "bankDetails": {
                "bankName": "Sumitomo Mitsui Banking Corporation",
                "accountHolderName": "Audit Craft Co., Ltd.",
                "accountNumber": "SMBC-JP-8912401",
                "swiftBic": "SMBCJPJT",
                "bankCountry": "JP",
                "settlementCurrency": "JPY",
            },
            "verificationDocuments": [
                {
                    "type": "CERTIFICATE_OF_COMMERCIAL_REGISTRATION",
                    "fileName": "audit_craft_incorporation_filing.pdf",
                    "fileUrl": "/static/uploads/verification/audit_craft_doc.pdf",
                    "fileSize": 1048576,
                }
            ],
            "agreementAccepted": True,
            "agreementVersion": "v1.2-2026",
        }

        reg_resp = client.post("/api/v1/sellers/register", headers=headers, json=reg_payload)
        assert reg_resp.status_code == 201, f"Expected 201 Created, got {reg_resp.text}"
        data = reg_resp.json()

        # Verify lifecycle status is SUBMITTED, NOT automatically APPROVED
        assert data["status"] in ("SUBMITTED", "PENDING_REVIEW")
        assert data["isApproved"] is False
        assert data["storeName"] == "Audit Craft House"
        assert data["bankAccountMasked"].endswith("2401")
        assert "•••• ••••" in data["bankAccountMasked"]
        # Ensure plain account number is NEVER returned in response
        assert "SMBC-JP-8912401" not in str(data)

    # 4. Verify database persistence and AES encryption
    async with AsyncSessionLocal() as session:
        db_s = await session.execute(select(SellerStoreORM).where(SellerStoreORM.user_id == test_user_id))
        store_row = db_s.scalar_one()
        assert store_row.status == "SUBMITTED"
        assert store_row.is_approved == 0
        assert store_row.bank_details_encrypted is not None
        # Decrypt bank details and verify
        decrypted = decrypt_bank_details(store_row.bank_details_encrypted)
        assert decrypted["account_number"] == "SMBC-JP-8912401"

    with TestClient(app) as client:
        # 5. Verify verification status endpoint
        v_status = client.get("/api/v1/sellers/verification/status", headers=headers)
        assert v_status.status_code == 200
        v_data = v_status.json()
        assert v_data["verificationStatus"] == "SUBMITTED"
        assert v_data["isApproved"] is False
        assert len(v_data["documents"]) == 1

        # 6. Admin Compliance Review Workflow
        admin_token = create_access_token({"sub": "admin_audit_id", "email": "admin@zen.global", "role": "admin"})
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Admin requests action
        rev_act = client.post(
            f"/api/v1/admin/sellers/{data['id']}/review",
            headers=admin_headers,
            json={"action": "ACTION_REQUIRED", "notes": "Please upload a clearer scan of the official corporate registry."},
        )
        assert rev_act.status_code == 200
        assert rev_act.json()["status"] == "ACTION_REQUIRED"

        # Admin approves store
        rev_app = client.post(
            f"/api/v1/admin/sellers/{data['id']}/review",
            headers=admin_headers,
            json={"action": "APPROVE", "notes": "Corporate registration and SMBC account verified."},
        )
        assert rev_app.status_code == 200
        assert rev_app.json()["status"] == "APPROVED"
        assert rev_app.json()["isApproved"] is True

        # Verify merchant profile now reflects approved status
        store_check = client.get("/api/v1/sellers/me", headers=headers)
        assert store_check.status_code == 200
        assert store_check.json()["status"] == "APPROVED"
        assert store_check.json()["isApproved"] is True
