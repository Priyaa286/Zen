# Zen Global — FastAPI Backend Integration, Multi-Vendor & Auth Contract

This document defines every REST contract consumed by the Zen Global frontend (`Zen/frontend/src/services/`).
All endpoints share `VITE_API_BASE_URL` (default: `http://localhost:8000/api`) with `withCredentials: true` enabled on Axios for HttpOnly cookie-based sessions.

---

## 1. Commerce, AI & PayPal Endpoints

| Method | Path | Service Function | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/agent/chat` | `agentService.sendChatMessage` | Accepts `message`, `conversation_id`, `destination_country`, `preferred_currency`, plus optional `residence_country`, `user_id` |
| `POST` | `/api/products/search` | `productService.searchProducts` | Accepts `query`, `destination_country`, `preferred_currency`, `origin_country`, `in_stock_only`, `max_budget`, `sort_by` |
| `GET` | `/api/products/{id}` | `productService.getProductById` | Query params: `?destination_country=IN&preferred_currency=INR` |
| `POST` | `/api/currency/convert` | `currencyService.convertCurrency` | Request `{ amount, from_currency, to_currency }` -> `{ original_amount, converted_amount, from_currency, to_currency, rate, timestamp }` |
| `POST` | `/api/shipping/check` | `shippingService.checkShipping` | Request `{ product_id, origin_country, destination_country, target_currency, quantity }` |
| `POST` | `/api/checkout/calculate` | `paymentService.calculateCheckout` | Authoritative backend breakdown (`product_price`, `currency_conversion_fee`, `shipping_charges`, `estimated_duties`, `estimated_taxes`, `total_payable`, `paypal_settlement_currency`, `paypal_settlement_amount`) |
| `POST` | `/api/checkout/create` | `paymentService.createCheckoutOrder` | Creates backend + PayPal order; returns `{ order_id, paypal_order_id, status }` |
| `POST` | `/api/checkout/capture` | `paymentService.captureCheckoutOrder` | Captures and verifies PayPal order on server (`{ paypal_order_id, order_id }`) |
| `GET` | `/api/orders/{id}` | `orderService.getOrderById` | Returns verified order receipt |

---

## 2. Authentication & User Account Endpoints

Gated by `VITE_ENABLE_BACKEND_AUTH=true` in Live API mode. When `VITE_ENABLE_BACKEND_AUTH=false`, the frontend preserves open Guest shopping in Live mode and avoids calling unimplemented `/api/auth/*` or `/api/users/*` routes.

### Recommended Session & Security Design
- Issue JWT or opaque session tokens via **`HttpOnly`**, **`Secure`** (in HTTPS), **`SameSite=Lax`** cookies.
- Hash user passwords server-side using **Argon2id** or **bcrypt**; never store or return plaintext passwords.
- Reject unauthenticated `/api/users/*` calls with HTTP `401 Unauthorized`.
- Roles: `BUYER`, `SELLER`, `ADMIN`. Enforced on the server; client claims are never trusted alone.
- Support independent localization attributes on every user: `residence_country`, `preferred_currency`, and `default_delivery_country`.

### `POST /api/auth/register`
- **Request:**
  ```json
  {
    "full_name": "Alex Rivera",
    "email": "alex@domain.com",
    "password": "StrongPassword123",
    "residence_country": "DE",
    "preferred_currency": "EUR"
  }
  ```
- **Response (`201 Created`):** `{ "user": <UserSchema> }` (plus `Set-Cookie` session cookie).

### `POST /api/auth/login`
- **Request:** `{ "email": "alex@domain.com", "password": "StrongPassword123", "remember_me": true }`
- **Response (`200 OK`):** `{ "user": <UserSchema> }`.

### `POST /api/auth/logout`
- Clears server session / invalidates `Set-Cookie`. Returns `{ "success": true }`.

### `GET /api/auth/me`
- Validates session cookie and returns `{ "user": <UserSchema> }` (or `401` when unauthenticated).

---

## 3. Multi-Vendor Merchant & Seller Portal Endpoints

These endpoints power `sellerService.js` and `/seller/*` views. Access requires `SELLER` or `ADMIN` role. Unverified sellers (`verification_status != 'APPROVED'`) are forbidden from publishing listings (`POST /api/seller/products`) or capturing live buyer disbursements.

### `POST /api/sellers/register`
- **Permissions:** Authenticated User (`BUYER` upgrading to `SELLER`).
- **Request:**
  ```json
  {
    "store_name": "Tokyo Optics & Craft",
    "slug": "tokyo-optics",
    "legal_business_name": "Tokyo Optics & Craft Co., Ltd.",
    "registration_number": "0100-01-123456",
    "tax_id": "T-98127391823",
    "business_address": "4-12 Ginza, Chuo-ku, Tokyo 104-0061, Japan",
    "origin_country": "JP",
    "currency": "JPY",
    "primary_category": "electronics",
    "description": "Authentic Japanese precision optics and camera gear.",
    "bank_details": {
      "bank_name": "Sumitomo Mitsui Banking Corporation",
      "account_number": "SMBC-JP-9948201",
      "swift_bic": "SMBCJPJT"
    },
    "verification_documents": [
      {
        "type": "CERTIFICATE_OF_INCORPORATION",
        "file_name": "tokyo_optics_corporate_reg.pdf"
      }
    ]
  }
  ```
- **Response (`201 Created`):**
  ```json
  {
    "store": {
      "id": "store-tokyo-optics",
      "owner_id": "usr-tokyo-optics",
      "store_name": "Tokyo Optics & Craft",
      "verification_status": "PENDING_REVIEW",
      "origin_country": "JP",
      "currency": "JPY"
    }
  }
  ```

### `GET /api/sellers/me` & `PUT /api/sellers/me`
- Returns authenticated seller's store profile, verification status, and admin review notes.

### `GET /api/seller/products` & `POST /api/seller/products`
- Lists and creates merchant-specific catalog items.
- Item contains `original_price` (in merchant currency), `origin_country`, `weight_kg`, `stock`, `category`.

### `PUT /api/seller/products/{id}` & `DELETE /api/seller/products/{id}`
- Updates stock, price, title, or archives listing.

### `GET /api/seller/orders`
- Returns orders containing fulfillment packages assigned to the authenticated merchant.

### `PUT /api/seller/orders/{id}/status`
- Transitions order through lifecycle: `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`.

### `POST /api/seller/orders/{id}/tracking`
- Dispatches international tracking details:
  ```json
  {
    "carrier": "DHL Express Global",
    "tracking_number": "DHL-JP-892184912",
    "origin_warehouse": "Tokyo Narita Air Hub",
    "estimated_delivery_days": "3-5 business days"
  }
  ```
- Automatically marks fulfillment package as `SHIPPED` and appends immutable audit event.

### `GET /api/seller/analytics`
- Returns sales aggregates, top buyer countries (e.g. India 42%, US 31%), and conversion metrics.

### `GET /api/seller/settlements`
- Financial transparency statement:
  ```json
  {
    "gross_sales": 1980000,
    "platform_fee_percent": 0.05,
    "platform_fee": 99000,
    "refunds": 0,
    "net_settlement": 1881000,
    "currency": "JPY",
    "settlement_status": "SCHEDULED"
  }
  ```
- **Clearance Notice:** Differentiates customer PayPal capture (in platform escrow) from net bank transfer settlement to merchant IBAN.

---

## 4. Platform Administration & Compliance Endpoints

These endpoints power `adminService.js` and `/admin` views. Access strictly requires `ADMIN` role.

### `GET /api/admin/stats`
- Returns marketplace-wide KPIs: Total merchants, verified merchants, pending reviews, active products, GMV, and dispute rate.

### `GET /api/admin/sellers` & `POST /api/admin/sellers/{store_id}/review`
- Inspects pending applications and reviews decision:
  ```json
  {
    "decision": "APPROVED", // "APPROVED" | "REJECTED" | "SUSPENDED"
    "admin_notes": "Corporate registry and tax documents authenticated.",
    "actor_email": "admin@zen.global"
  }
  ```

### `GET /api/admin/products` & `POST /api/admin/products/{product_id}/moderate`
- Overrides product moderation status (`APPROVED`, `REJECTED`, `ARCHIVED`).

### `GET /api/admin/users` & `PUT /api/admin/users/{user_id}/role`
- Inspects user registry and updates account privileges (`BUYER`, `SELLER`, `ADMIN`).

### `GET /api/admin/audit-logs`
- Returns append-only chronological log of all administrative actions with actor, target, timestamp, and details.

---

## 5. Canonical Multi-Role `<UserSchema>`

```json
{
  "id": "usr-demo-aarav",
  "full_name": "Aarav Sharma",
  "email": "aarav@zen.global",
  "role": "BUYER",
  "store_id": null,
  "store_name": null,
  "verification_status": null,
  "residence_country": "IN",
  "preferred_currency": "INR",
  "default_delivery_country": "IN",
  "onboarding_completed": true,
  "saved_product_ids": ["prod-fujifilm-x100vi-jp"],
  "auth_provider": "email",
  "created_at": "2026-10-01T10:00:00.000Z"
}
```
