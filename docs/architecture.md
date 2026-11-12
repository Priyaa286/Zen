# Zen Global — Multi-Tenant Architecture & Technical Design

## 1. System Overview
Zen Global is an international multi-vendor ecommerce marketplace. It connects international buyers with regional merchants across multiple countries (Japan, United States, Germany, India, United Kingdom, South Korea, etc.) while solving three core cross-border commerce friction points:
1. **Landed Cost Transparency**: Upfront computation of HS-code customs duties, import tariffs, and air freight so buyers never face surprise fees on delivery.
2. **Dual-Currency Integrity**: Preserves merchant listing prices immutably in their native currency (e.g. JPY, EUR, USD) while rendering live dynamic conversions to the buyer's preferred local currency (e.g. INR, USD, EUR).
3. **Multi-Vendor Order Fulfillment**: Single unified customer checkout supported by merchant-specific fulfillment packages with independent international air waybill tracking.

```
[ International Buyer ]
        │
        ├── Browses catalog localized to preferred currency (e.g. INR)
        ├── Views transparent landed cost (FX + Shipping + Duties)
        └── Captures payment via PayPal Escrow in Buyer Currency
                    │
                    ▼
          [ Zen Platform Escrow ]
                    │
     ┌──────────────┴──────────────┐
     ▼                             ▼
[ Tokyo Optics & Craft (JP) ]   [ Berlin Audio Works (DE) ]
- Fulfills Package 1 (JPY)      - Fulfills Package 2 (EUR)
- Dispatches DHL Tracking        - Dispatches FedEx Tracking
- Net Settlement: Gross - 5%    - Net Settlement: Gross - 5%
```

---

## 2. Role-Based Access Control (RBAC)

The platform enforces three strict operational roles:

| Role | Permissions & Privileges | Route Protections |
| --- | --- | --- |
| **`BUYER`** | Browse marketplace, compare products, save wishlist, place consolidated multi-merchant orders, track shipments, manage delivery addresses. | Base routes (`/`, `/results`, `/product/:id`, `/checkout`, `/account`). Denied from `/seller/*` and `/admin`. |
| **`SELLER`** | Register commercial storefront, manage catalog inventory, process order packages, attach international tracking (DHL/FedEx), monitor analytics, view settlement statements. Must have `verification_status == 'APPROVED'` to publish live listings. | `/seller/dashboard`, `/seller/verification`, `/seller/register`. Denied from `/admin`. |
| **`ADMIN`** | Platform oversight, review corporate registration & export documents, approve/reject/suspend merchant stores, moderate product catalog, inspect user roles, monitor cross-border dispute rates, inspect append-only audit log. | Full access including `/admin`. |

### Security Safeguards
- Roles are assigned server-side in the user session record.
- Frontend `<RoleRoute>` checks both authentication state and role membership, redirecting unauthorized buyers to `/sell` with a guided registration prompt.
- API endpoints validate role tokens on every mutation (e.g., non-sellers cannot call `POST /api/seller/products`).

---

## 3. Dual-Currency & Landed Cost Computation Engine

To protect merchants against foreign exchange volatility:
- **Original Merchant Price**: Stored immutably in the seller's base currency (e.g., `145,000 JPY`).
- **Dynamic Conversion**: Computed at presentation time using institutional exchange rates:
  $$\text{Converted Price} = \text{Original Price} \times \text{FX Rate}$$
- **Landed Cost Breakdown**:
  $$\text{Delivered Total} = \text{Converted Subtotal} + \text{Air Freight} + \text{Customs Duties} + \text{Import Taxes}$$
- **Settlement Clearance Distinction**:
  - Buyer pays in target currency via PayPal Sandbox capture.
  - Platform holds funds in escrow until shipment dispatch verification.
  - Merchant receives net payout in **origin currency** (Gross minus 5% platform fee) directly to corporate bank account (IBAN/SWIFT).

---

## 4. Multi-Merchant Cart & Fulfillment Model

When a buyer's cart contains items from multiple stores:
- Each item retains its originating `merchant_id`, `warehouse_country`, and `shipping_tier`.
- Cart displays multi-package grouping so the customer understands delivery timelines from different geographic regions.
- On payment capture, the system generates:
  1. A master **Buyer Order** (`order_id`) containing the consolidated financial receipt.
  2. Multiple **Merchant Fulfillment Sub-Orders** (`package_id`), each assigned to its respective merchant with independent fulfillment lifecycle states:
     $$\text{NEW} \longrightarrow \text{CONFIRMED} \longrightarrow \text{PROCESSING} \longrightarrow \text{SHIPPED} \longrightarrow \text{DELIVERED}$$
  3. Per-merchant tracking carrier and air waybill assignment.

