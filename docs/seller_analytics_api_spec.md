# Zen Global — Merchant Business Centre & Financial Analytics API Specification

**Document Version:** 1.0.0  
**Target Backend:** FastAPI (`Zen/backend/app/api/routes/seller.py`, `seller_analytics.py`)  
**Audience:** Backend Team (Member 1) & Frontend Architects  
**Status:** Approved for Implementation

---

## 1. Executive Summary

This document specifies the REST API endpoints required to support the upgraded **Zen Global Merchant Business Centre & Financial Analytics Suite**. 

All monetary calculations must be denominated in the **merchant's base currency** (e.g. `JPY` for Tokyo Optics & Craft, `EUR` for Berlin Sound GmbH) to prevent multi-currency distortion caused by buyer FX conversions at PayPal checkout.

---

## 2. Global Conventions & Standards

### 2.1 Currency & Precision
- All merchant-facing financial values must use integer cents/minor units or standard floating precision serialized as numbers with 2 decimal places (or 0 for zero-decimal currencies like `JPY`).
- Field names must clearly indicate currency: `gross_sales`, `net_revenue`, `platform_fee`, `gateway_fee`, `refunds`.
- Currency must match `store.currency` (ISO 4217).

### 2.2 Date Ranges & Aggregation
Supported `date_range` query parameters:
- `today`, `yesterday`, `7d` (last 7 days), `30d` (last 30 days), `90d` (last 90 days), `this_month`, `last_month`, `this_year`, `custom`.
- When `date_range=custom`, `start_date` and `end_date` (ISO 8601 strings, e.g. `2026-11-01T00:00:00Z`) are required.
- Historical comparison (`compare_previous=true`) returns `current_period` and `previous_period` objects.

### 2.3 Authentication & Authorization
- **Header:** `Authorization: Bearer <jwt_access_token>`
- **Role Requirement:** Role must be `SELLER` or `ADMIN`. The authenticated seller can only access data where `store_id == seller.store_id`.

---

## 3. Endpoints

### 3.1 `GET /api/v1/seller/analytics/overview`
Retrieves consolidated KPI metrics for the merchant dashboard overview tab.

#### Query Parameters:
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `date_range` | string | No | `30d` | Preset date window |
| `start_date` | string (ISO) | Conditional | - | Required if `date_range=custom` |
| `end_date` | string (ISO) | Conditional | - | Required if `date_range=custom` |
| `compare` | boolean | No | `true` | Include period-over-period delta |

#### Response (`200 OK`):
```json
{
  "store_id": "store-tokyo-optics",
  "base_currency": "JPY",
  "date_range": "30d",
  "financial_kpis": {
    "gross_sales": 1450000,
    "net_revenue": 1334000,
    "platform_fee": 72500,
    "gateway_fee": 43500,
    "total_refunds": 0,
    "pending_settlement": 420000,
    "completed_payouts": 914000,
    "gross_sales_delta_pct": 14.8,
    "net_revenue_delta_pct": 15.2
  },
  "operational_kpis": {
    "total_orders": 38,
    "new_orders": 4,
    "processing_orders": 6,
    "completed_orders": 28,
    "average_order_value": 38158,
    "active_products": 14,
    "low_stock_products": 2,
    "order_volume_delta_pct": 8.6
  }
}
```

---

### 3.2 `GET /api/v1/seller/analytics/sales`
Provides timeseries data and distributions for revenue and order volume charting.

#### Query Parameters:
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `date_range` | string | No | `30d` | Preset date window |
| `interval` | string | No | `day` | `day`, `week`, or `month` |

#### Response (`200 OK`):
```json
{
  "store_id": "store-tokyo-optics",
  "base_currency": "JPY",
  "period": {
    "start": "2026-10-14T00:00:00Z",
    "end": "2026-11-12T23:59:59Z",
    "interval": "day"
  },
  "timeline": [
    { "date": "2026-11-06", "gross_sales": 48000, "net_revenue": 44160, "orders": 2, "aov": 24000 },
    { "date": "2026-11-07", "gross_sales": 72000, "net_revenue": 66240, "orders": 3, "aov": 24000 },
    { "date": "2026-11-08", "gross_sales": 95000, "net_revenue": 87400, "orders": 2, "aov": 47500 },
    { "date": "2026-11-09", "gross_sales": 34000, "net_revenue": 31280, "orders": 1, "aov": 34000 },
    { "date": "2026-11-10", "gross_sales": 118000, "net_revenue": 108560, "orders": 4, "aov": 29500 },
    { "date": "2026-11-11", "gross_sales": 142000, "net_revenue": 130640, "orders": 3, "aov": 47333 },
    { "date": "2026-11-12", "gross_sales": 85000, "net_revenue": 78200, "orders": 2, "aov": 42500 }
  ],
  "category_breakdown": [
    { "category": "Optics & Cameras", "revenue": 840000, "share_pct": 57.9 },
    { "category": "Electronics & Audio", "revenue": 420000, "share_pct": 29.0 },
    { "category": "Craft & Accessories", "revenue": 190000, "share_pct": 13.1 }
  ]
}
```

---

### 3.3 `GET /api/v1/seller/transactions`
Retrieves a paginated list of financial ledger transactions.

#### Query Parameters:
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | integer | No | `1` | Page index |
| `limit` | integer | No | `20` | Max items per page |
| `status` | string | No | `ALL` | `ALL`, `SUCCESS`, `PENDING`, `REFUNDED`, `FAILED` |
| `order_id` | string | No | - | Filter by order ID |
| `search` | string | No | - | Filter by customer name, email, or txn ID |

#### Response (`200 OK`):
```json
{
  "transactions": [
    {
      "id": "txn_892184912",
      "order_id": "ORD-2026-8921",
      "store_id": "store-tokyo-optics",
      "timestamp": "2026-11-12T09:15:00Z",
      "payment_provider": "PayPal Sandbox",
      "provider_capture_id": "CAPTURE-8912-PP",
      "status": "SUCCESS",
      "buyer_name": "Aarav Sharma",
      "buyer_country": "IN",
      "buyer_currency": "INR",
      "buyer_paid_amount": 84500,
      "merchant_currency": "JPY",
      "gross_amount": 145000,
      "platform_fee": 7250,
      "gateway_fee": 4205,
      "net_amount": 133545,
      "settlement_status": "PENDING_CLEARANCE",
      "settlement_estimated_date": "2026-11-15T09:15:00Z"
    }
  ],
  "pagination": {
    "total": 38,
    "page": 1,
    "limit": 20,
    "total_pages": 2
  },
  "summary": {
    "total_volume": 1450000,
    "successful_volume": 1450000,
    "pending_volume": 0,
    "refunded_volume": 0,
    "total_gateway_fees": 43500
  }
}
```

---

### 3.4 `GET /api/v1/seller/revenue/statement`
Returns an itemized financial accounting statement suitable for merchant bookkeeping.

#### Response (`200 OK`):
```json
{
  "store_id": "store-tokyo-optics",
  "statement_period": "2026-10-01 to 2026-10-31",
  "currency": "JPY",
  "gross_sales": {
    "product_sales": 1380000,
    "shipping_collected": 70000,
    "total_gross": 1450000
  },
  "deductions": {
    "refunds": 0,
    "merchant_discounts": 0,
    "platform_commission_5pct": 72500,
    "payment_processing_fees": 43500,
    "total_deductions": 1160000
  },
  "net_merchant_revenue": 1334000,
  "settlement_reconciliation": {
    "previously_paid_out": 914000,
    "in_transit_escrow": 240000,
    "available_for_next_batch": 180000
  }
}
```

---

### 3.5 `GET /api/v1/seller/analytics/corridors`
Returns geographical distribution and international shipping lane performance.

#### Response (`200 OK`):
```json
{
  "store_id": "store-tokyo-optics",
  "origin_country": "JP",
  "base_currency": "JPY",
  "corridors": [
    {
      "destination_country": "IN",
      "destination_country_name": "India",
      "order_count": 18,
      "gross_revenue": 680000,
      "share_pct": 46.9,
      "primary_carrier": "DHL Express Global",
      "avg_transit_days": 4.2
    },
    {
      "destination_country": "US",
      "destination_country_name": "United States",
      "order_count": 12,
      "gross_revenue": 490000,
      "share_pct": 33.8,
      "primary_carrier": "FedEx International",
      "avg_transit_days": 3.8
    },
    {
      "destination_country": "DE",
      "destination_country_name": "Germany",
      "order_count": 5,
      "gross_revenue": 180000,
      "share_pct": 12.4,
      "primary_carrier": "DHL Express Global",
      "avg_transit_days": 5.1
    },
    {
      "destination_country": "GB",
      "destination_country_name": "United Kingdom",
      "order_count": 3,
      "gross_revenue": 100000,
      "share_pct": 6.9,
      "primary_carrier": "DHL Express Global",
      "avg_transit_days": 4.5
    }
  ]
}
```

---

### 3.6 `GET /api/v1/seller/reports/export`
Generates a downloadable CSV report for transactions, revenue statement, or product performance.

#### Query Parameters:
- `report_type`: `transactions` | `revenue_statement` | `products` | `orders`
- `date_range`: `30d` | `90d` | `this_year` | `custom`

---

## 4. Error Responses
Standard RFC 7807 problem details:
- `401 Unauthorized`: Token missing or invalid.
- `403 Forbidden`: Authenticated user is not an authorized seller for this store.
- `404 Not Found`: Store or entity not found.
- `422 Unprocessable Entity`: Invalid date format or unrecognized query parameters.

