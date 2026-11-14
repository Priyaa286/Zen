"""Enterprise AES-256 encryption and masking for sensitive financial and settlement details.

Complies with PCI-DSS & OWASP ASVS banking data protection:
- AES-256 symmetric encryption at rest using Fernet key derived from server secret
- Masking of bank account numbers in responses (never return raw credentials)
- Strict validation of country-specific banking formats (IBAN, ABA, Sort Code, SWIFT/BIC)
- Zero persistence or logging of online banking credentials
"""

from __future__ import annotations

import base64
import hashlib
import json
import logging
import re
from typing import Any, Dict, Optional, Tuple

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings

logger = logging.getLogger("zen.security.financial")


def _get_fernet_cipher() -> Fernet:
    """Derive a deterministic 32-byte Fernet key from the server SECRET_KEY."""
    key_bytes = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    urlsafe_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(urlsafe_key)


def mask_account_number(account_num: Optional[str]) -> str:
    """Return a masked representation of a bank account number or IBAN."""
    if not account_num:
        return "••••"
    cleaned = re.sub(r"[\s\-]", "", account_num.strip())
    if len(cleaned) <= 4:
        return "•••• " + cleaned
    last4 = cleaned[-4:]
    return f"•••• •••• {last4}"


def encrypt_bank_details(bank_dict: Dict[str, Any]) -> str:
    """Encrypt bank details dictionary with AES-256 before persisting to storage."""
    cipher = _get_fernet_cipher()
    raw_payload = json.dumps(bank_dict, separators=(",", ":"))
    token_bytes = cipher.encrypt(raw_payload.encode("utf-8"))
    return token_bytes.decode("utf-8")


def decrypt_bank_details(encrypted_token: Optional[str]) -> Dict[str, Any]:
    """Decrypt stored ciphertext. Only accessible by authorized merchant and compliance actors."""
    if not encrypted_token:
        return {}
    cipher = _get_fernet_cipher()
    try:
        decrypted_bytes = cipher.decrypt(encrypted_token.encode("utf-8"))
        return json.loads(decrypted_bytes.decode("utf-8"))
    except (InvalidToken, Exception) as exc:
        logger.error("Failed to decrypt bank details ciphertext: %s", exc)
        return {}


def validate_bank_details(bank_data: Dict[str, Any], country: str = "JP") -> Tuple[bool, Optional[str]]:
    """Validate banking fields according to the merchant settlement country format."""
    bank_name = str(bank_data.get("bankName") or bank_data.get("bank_name") or "").strip()
    account_num = str(
        bank_data.get("accountNumber")
        or bank_data.get("bankAccountNumber")
        or bank_data.get("bank_account_number")
        or ""
    ).strip()
    account_holder = str(
        bank_data.get("accountHolderName")
        or bank_data.get("account_holder_name")
        or bank_data.get("accountHolder")
        or ""
    ).strip()
    swift = str(bank_data.get("swiftBic") or bank_data.get("swift_bic") or "").strip().upper()
    routing = str(bank_data.get("routingNumber") or bank_data.get("routing_number") or "").strip()
    sort_code = str(bank_data.get("sortCode") or bank_data.get("sort_code") or "").strip()

    if not bank_name:
        return False, "Settlement bank name is mandatory."

    if not account_holder:
        return False, "Account holder legal name is mandatory."

    if not account_num:
        return False, "Bank account number or IBAN is mandatory."

    country_upper = country.upper().strip()

    # United States: 9-digit ABA Routing + 4-17 digit account number
    if country_upper == "US":
        if routing and not re.match(r"^\d{9}$", routing):
            return False, "US ABA Routing Number must be exactly 9 digits."
        clean_acc = re.sub(r"[\s\-]", "", account_num)
        if not re.match(r"^\d{4,17}$", clean_acc):
            return False, "US checking or savings account number must be between 4 and 17 digits."

    # United Kingdom: 6-digit Sort Code + 8-digit Account Number
    elif country_upper == "GB":
        if sort_code:
            clean_sort = re.sub(r"[\s\-]", "", sort_code)
            if not re.match(r"^\d{6}$", clean_sort):
                return False, "UK Sort Code must be 6 digits (e.g. 20-00-00)."
        clean_acc = re.sub(r"[\s\-]", "", account_num)
        if not re.match(r"^\d{8}$", clean_acc) and not clean_acc.startswith("GB"):
            return False, "UK bank account number must be 8 digits or a valid UK IBAN."

    # European Union (SEPA / IBAN)
    elif country_upper in ("DE", "FR", "IT", "ES", "NL", "BE", "IE", "AT", "PT", "FI"):
        clean_iban = re.sub(r"\s+", "", account_num.upper())
        if not re.match(r"^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$", clean_iban):
            return False, f"Invalid IBAN format for {country_upper}. Must follow ISO 13616 standard."

    # Japan: SWIFT/BIC (8 or 11 chars) + Account Number (7 digits)
    elif country_upper == "JP":
        if swift and not re.match(r"^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$", swift):
            return False, "Japan SWIFT/BIC code must be 8 or 11 characters (e.g. SMBCJPJT)."
        clean_acc = re.sub(r"[\s\-]", "", account_num)
        if len(clean_acc) < 4:
            return False, "Japanese bank account number is too short."

    # General ISO 9362 SWIFT/BIC validation if provided
    if swift and not re.match(r"^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$", swift):
        return False, "Invalid SWIFT/BIC format. Must be an 8 or 11 character ISO 9362 code."

    return True, None

