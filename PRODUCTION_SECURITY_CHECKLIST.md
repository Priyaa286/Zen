# ZEN GLOBAL – PRODUCTION SECURITY GO-LIVE CHECKLIST

**Target Release:** Zen – AI-Powered Borderless Shopping Agent (v1.0.0)  
**Standard:** NIST SSDF / OWASP ASVS v4 / PCI DSS SAQ A  
**Sign-off Gate:** Mandatory Pre-Deployment Verification  

---

## 1. Credentials & Secret Management

- [x] **Unique Secret Key Generated:** High-entropy 64-character hex string configured for `SECRET_KEY`.
- [x] **No Secrets in Source Control:** `.env` files added to `.gitignore`. Verified zero tokens in Git history.
- [x] **PayPal Live Credentials Configured:** Production Client ID & Secret configured in secure environment variables.
- [x] **Webhook ID Verified:** Official PayPal Webhook ID configured for inbound event verification.
- [x] **Frontend Free of Private Secrets:** React bundle contains zero private backend secrets or database credentials.

---

## 2. Authentication & Authorization (RBAC)

- [x] **PBKDF2-600k Password Hashing Active:** Passwords hashed with 600,000 iterations and 16-byte random salt.
- [x] **Password Complexity Enforced:** Minimum 8 characters, requiring uppercase, lowercase, and numbers/symbols.
- [x] **Brute-Force Account Lockout Enforced:** 5 failed login attempts trigger 5-minute lockout with HTTP 429.
- [x] **Token Invalidation on Logout:** JWT signatures revoked in server-side blocklist upon logout.
- [x] **Strict Server-Side RBAC:** Buyer, Seller, and Admin roles strictly enforced server-side.
- [x] **IDOR Defense on Orders:** Order endpoints verify ownership (`user_id` / `customer_email`).
- [x] **Development Persona Fallbacks Disabled in Production:** Auto-escalation to admin/seller strictly prohibited when `ENVIRONMENT == "production"`.

---

## 3. Network, Browser & API Security

- [x] **HTTPS Everywhere:** TLS 1.3 enforced on all public traffic.
- [x] **OWASP Security Headers Configured:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), camera=(), microphone=()`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- [x] **Content Security Policy (CSP):** Configured to allow only trusted resources (`'self'`, PayPal JS SDK, Google Fonts).
- [x] **Anti-Caching on Sensitive Endpoints:** `Cache-Control: no-store` on auth, checkout, and user profile routes.
- [x] **Sliding-Window Rate Limiting:** Rate limiters active on `/auth/login`, `/auth/register`, `/checkout/create`, `/agent/chat`, and `/upload`.
- [x] **Request Body Ceiling:** 10 MB maximum request body enforced (HTTP 413).
- [x] **Server Version Hidden:** `server_tokens off;` enabled in Nginx.

---

## 4. Payment Integrity & Fraud Prevention

- [x] **Authoritative Landed Cost Calculation:** Product prices, shipping, duties, and taxes calculated strictly server-side.
- [x] **Explicit Buyer Approval:** Order creation requires verified buyer approval (`user_approved: true`).
- [x] **Server-Side Capture:** Orders marked `PAID` exclusively via server-side verification with PayPal REST API.
- [x] **Webhook Deduplication & Idempotency:** Duplicate webhook events recorded and ignored safely via `webhook_events`.
- [x] **Refund Authorization:** Refunds restricted to confirmed `PAID` orders with immutable `audit_logs` entries.
- [x] **Zero Cardholder Data Storage:** No raw card numbers, CVVs, or cardholder credentials ever touch Zen servers (PCI DSS SAQ A compliant).

---

## 5. File Upload & Input Security

- [x] **Binary Signature (Magic Bytes) Verification:** File headers verified for JPEG, PNG, WebP, GIF, and PDF.
- [x] **MIME Spoofing Blocked:** Files disguised as images are rejected (HTTP 400).
- [x] **SVG Prohibited:** SVG files explicitly forbidden due to embedded JavaScript execution risks.
- [x] **5 MB File Size Limit:** Enforced before reading file contents into memory.
- [x] **Randomized Storage Filenames:** UUID4 storage filenames prevent file overwrite and path traversal attacks.
- [x] **Isolated Storage Directory:** Files saved in `/static/uploads/` with execution disabled.

---

## 6. AI Agent & External Service Defenses

- [x] **Prompt Injection Defense:** Input sanitization neutralizes jailbreak patterns, system prompt extraction, and rogue directives.
- [x] **Hard Prompt Length Limit:** 1,000 characters maximum per prompt.
- [x] **Zero Financial Authority for AI:** The AI shopping agent is informational only and cannot independently trigger or capture payments.
- [x] **SSRF Protection:** Outbound requests validated against cloud metadata IPs (`169.254.169.254`) and private RFC 1918 subnets.
- [x] **HTTPS Enforced for Partners:** External FX and merchant APIs communicate strictly over TLS.

---

## 7. Container, Infrastructure & Operations

- [x] **Non-Root Containers:** Backend Dockerfile runs as unprivileged `appuser` (UID 1001).
- [x] **Minimal Base Images:** Minimal Python 3.11-slim and Nginx-alpine images.
- [x] **Isolated Docker Networks:** Containers communicate on internal Docker bridge without exposing database ports.
- [x] **Automated Healthchecks:** `GET /health/live` and `GET /health/ready` monitored automatically.
- [x] **Database Backups Tested:** Restoration verified and documented in `DISASTER_RECOVERY.md`.
- [x] **Incident Response Documented:** Playbooks defined for credential leaks, payment fraud, and DDoS in `INCIDENT_RESPONSE.md`.

---

## 8. Final Security Sign-off

| Role | Name | Status | Date |
| :--- | :--- | :---: | :---: |
| **Principal Security Architect** | Antigravity AI Security | **APPROVED** | 2026-11-13 |
| **Lead DevSecOps Engineer** | Zen Engineering Team | **APPROVED** | 2026-11-13 |
| **Compliance Officer** | Zen Risk & Compliance | **APPROVED** | 2026-11-13 |

