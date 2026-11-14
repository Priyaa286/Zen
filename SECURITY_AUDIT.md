# ZEN GLOBAL – ENTERPRISE CYBERSECURITY AUDIT REPORT

**Document ID:** SEC-AUDIT-2026-11  
**Assessment Target:** Zen – AI-Powered Borderless Shopping Agent  
**Standard:** OWASP Top 10 (2021), OWASP ASVS v4.0.3, OWASP API Security Top 10 (2023), NIST SSDF  
**Classification:** Internal / Production Readiness Artifact  
**Status:** **REMEDIATED & VERIFIED**

---

## 1. Executive Summary

A comprehensive application security audit of the **Zen – AI-Powered Borderless Shopping Agent** repository was conducted covering the React 18 single-page application frontend, FastAPI asynchronous backend, SQLAlchemy database models, PayPal checkout integration, AI shopping assistant, file upload endpoints, Nginx reverse proxy, and container configurations.

### Key Risk Metrics
- **Initial Vulnerabilities Discovered:** 7 (1 Critical, 3 High, 2 Medium, 1 Low)
- **Remediated Vulnerabilities:** 7 / 7 (100% Remediation Rate)
- **Residual Unmitigated Critical/High Risks:** 0
- **Regression Tests Passing:** 106 / 106 Pytest tests, 42 / 42 SEO/Responsive tests, 8 / 8 Multi-Vendor tests.

---

## 2. Vulnerability Assessment & Findings Matrix

| Finding ID | Vulnerability Name | Affected Component | Severity | CVSS v3.1 | Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **SEC-01** | Unauthenticated Fallback Role Escalation | `app/core/security.py` | **CRITICAL** | 9.8 | **REMEDIATED** |
| **SEC-02** | Insecure Direct Object Reference (IDOR) on Orders | `app/api/v1/endpoints/checkout.py` | **HIGH** | 8.5 | **REMEDIATED** |
| **SEC-03** | Weak Password Hashing Algorithm (Static SHA-256) | `app/core/security.py` | **HIGH** | 7.5 | **REMEDIATED** |
| **SEC-04** | Missing File Signature Verification & MIME Spoofing | `app/api/v1/endpoints/uploads.py` | **HIGH** | 7.3 | **REMEDIATED** |
| **SEC-05** | Lack of Server-Side Request Forgery (SSRF) Filters | `app/services/currency_service.py` | **MEDIUM** | 6.8 | **REMEDIATED** |
| **SEC-06** | Missing Content-Security-Policy & HSTS Headers | `app/core/middleware.py`, `nginx.conf` | **MEDIUM** | 5.3 | **REMEDIATED** |
| **SEC-07** | Server Version Header Disclosure | `Zen/nginx.conf`, `frontend/nginx.conf` | **LOW** | 3.1 | **REMEDIATED** |

---

## 3. Deep-Dive Findings & Remediations

### Finding SEC-01: Unauthenticated Fallback Role Escalation
- **Vulnerability**: In `app/core/security.py`, `get_current_seller` and `get_current_admin` contained development fallbacks that automatically loaded the database record for `admin@zen.global` or `seller@zen.global` when no authenticated user was present.
- **Exploitation Scenario**: An external adversary sending requests to `/api/admin/*` or `/api/seller/*` without an `Authorization` header was automatically granted administrative or merchant privileges.
- **Remediation**:
  1. Removed unauthenticated auto-escalation.
  2. Implemented strict production mode enforcement: in production (`ENVIRONMENT == "production"`), requests without a signed, unrevoked JWT return immediate `401 Unauthorized` or `403 Forbidden`.
  3. Non-production testing compatibility is gated strictly by an explicit header `X-Zen-Demo-Persona`.
- **Verification**: `test_04_rbac_privilege_escalation_barrier` confirms non-admin callers receive HTTP 403.

### Finding SEC-02: Insecure Direct Object Reference (IDOR) on Orders
- **Vulnerability**: `/api/orders/{order_id}` retrieved order records by identifier without checking whether the requesting caller was the owner, affiliated merchant, or platform administrator.
- **Exploitation Scenario**: A malicious buyer could iterate through order IDs (`ord_*`) or PayPal transaction IDs to inspect customer shipping addresses, product details, and payment statuses.
- **Remediation**:
  1. Added object-level authorization in `get_order_endpoint`.
  2. Buyers are strictly validated against `(order.user_id == user.id) or (order.customer_email == user.email)`. Non-owners receive `HTTP 403 Forbidden`.
  3. Sellers can only view orders associated with their registered `store_id`.
  4. Administrators retain compliance audit privileges.
- **Verification**: `test_05_idor_order_protection` verified that Buyer B cannot access Buyer A's order.

### Finding SEC-03: Weak Password Hashing Algorithm (Static SHA-256)
- **Vulnerability**: Passwords were hashed using static `hashlib.sha256(f"zen_salt_{password}")` without work-factor iteration or per-user cryptographic salts, vulnerable to GPU rainbow tables.
- **Remediation**:
  1. Upgraded to **PBKDF2-HMAC-SHA256** with **600,000 iterations** and a 16-byte random salt (`os.urandom(16)`), formatted as `$pbkdf2-sha256$600000$salt_hex$hash_hex`.
  2. Implemented timing-safe verification (`hmac.compare_digest`).
  3. Implemented automatic backward-compatible verification and silent hash migration: when legacy users sign in, their hash is automatically re-hashed with PBKDF2.
  4. Implemented OWASP ASVS password complexity validation (min 8 chars, uppercase, lowercase, numbers/special characters).
- **Verification**: `test_01_password_hashing_and_strength_validation` passed.

### Finding SEC-04: Missing File Signature Verification & MIME Spoofing
- **Vulnerability**: `/api/upload` relied solely on the client-supplied `Content-Type` header without verifying the actual binary magic header bytes.
- **Exploitation Scenario**: An attacker could upload an executable script or malicious SVG containing embedded `<script>` tags by supplying `Content-Type: image/png`.
- **Remediation**:
  1. Added binary signature validation: PNG (`\x89PNG\r\n\x1a\n`), JPEG (`\xff\xd8\xff`), GIF (`GIF87a`/`GIF89a`), WebP (`RIFF...WEBP`), PDF (`%PDF-`).
  2. Explicitly rejected all SVG uploads.
  3. Sanitized folder path strings to prevent directory traversal (`..`).
  4. Assigned non-deterministic UUID4 storage filenames.
- **Verification**: `test_07_file_upload_security_and_magic_bytes` confirms rejection of SVG and spoofed PNGs.

### Finding SEC-05: Lack of Server-Side Request Forgery (SSRF) Filters
- **Vulnerability**: Outbound currency and shipping integrations could potentially be coerced into resolving internal or cloud metadata endpoints.
- **Remediation**:
  1. Created `app/core/ssrf.py` with `validate_outbound_url`.
  2. Blocks cloud metadata IPs (`169.254.169.254`, `metadata.google.internal`).
  3. Blocks RFC 1918 private IP subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) and loopback (`127.0.0.0/8`).
  4. Enforces HTTPS on all external commerce endpoints.
- **Verification**: `test_09_ssrf_url_validation` confirms blocking of metadata and private IP endpoints.

### Finding SEC-06: Missing Content-Security-Policy & HSTS Headers
- **Vulnerability**: Browser security headers lacked a Content-Security-Policy and Strict-Transport-Security, increasing susceptibility to XSS and SSL stripping.
- **Remediation**:
  1. Configured CSP allowing `'self'`, PayPal JS SDK (`https://www.paypal.com`, `https://www.sandbox.paypal.com`), Google Fonts, and Frankfurter FX.
  2. Added `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
  3. Added `Cache-Control: no-store, no-cache, must-revalidate` on sensitive authentication and payment endpoints.
- **Verification**: `test_10_security_headers_and_anti_caching` verified in response headers.

### Finding SEC-07: Server Version Header Disclosure
- **Vulnerability**: Nginx configuration omitted `server_tokens off`, broadcasting exact web server build versions in HTTP response headers.
- **Remediation**:
  1. Added `server_tokens off;` to root `Zen/nginx.conf` and `Zen/frontend/nginx.conf`.
- **Verification**: Verified configuration files and AST.

---

## 4. Residual Risk Assessment

| Risk Area | Inherent Risk | Mitigations Applied | Residual Risk Level | Acceptable for Production? |
| :--- | :---: | :--- | :---: | :---: |
| **Payment Fraud** | High | Server-side quote calculation, PayPal capture verification, duplicate webhook rejection | **LOW** | YES |
| **Account Takeover** | High | PBKDF2-600k hashing, 5-attempt brute-force lockout, token revocation on logout | **LOW** | YES |
| **File Upload Abuse** | High | Magic byte verification, SVG ban, UUID filenames, 5MB limit | **LOW** | YES |
| **Volumetric DDoS** | High | In-memory sliding-window rate limiting; Cloudflare WAF recommended at edge | **MEDIUM** | YES (with Edge CDN) |

