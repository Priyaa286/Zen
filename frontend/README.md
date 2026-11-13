# Zen — PayPal Borderless Buying Agent (Frontend)

Zen is an AI-powered cross-border shopping assistant that helps buyers discover international products, compare global merchants, view real-time currency conversions and customs estimates, explicitly approve transparent landed costs, and complete checkout via PayPal.

---

## Tech Stack

- **React 18** + **Vite**
- **Tailwind CSS** + **shadcn/ui** (Radix UI primitives + CVA)
- **Lucide React** icons
- **React Router DOM** v6
- **Axios** (centralized API client with `withCredentials: true` & snake_case/camelCase adapters)
- **React Context API** (`CurrencyContext`, `AppContext`, `AuthContext`, `CartContext`, `ChatContext`, `ToastContext`)
- **PayPal React SDK** (`@paypal/react-paypal-js`)
- **Framer Motion**

---

## Installation & Running Locally

### 1. Navigate to the frontend directory
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```
*(On Windows PowerShell if script execution policy blocks `npm.ps1`, run `npm.cmd install`.)*

### 3. Configure environment variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Environment variables:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_USE_MOCK_API=true
VITE_PAYPAL_CLIENT_ID=sb
VITE_DEFAULT_CURRENCY=INR
VITE_DEFAULT_COUNTRY=IN
VITE_APP_NAME=Zen
VITE_ENABLE_BACKEND_AUTH=false
VITE_GOOGLE_OAUTH_CLIENT_ID=
```

- Set `VITE_USE_MOCK_API=true` to run the frontend independently using the isolated `src/mocks/` layer (including full salted SHA-256 demo authentication, onboarding, saved items, and order history).
- Set `VITE_USE_MOCK_API=false` and provide your PayPal Sandbox Client ID in `VITE_PAYPAL_CLIENT_ID` when connecting to the FastAPI backend.
- Set `VITE_ENABLE_BACKEND_AUTH=true` once the FastAPI `/api/auth/*` and `/api/users/*` endpoints are deployed (otherwise Live mode preserves open Guest shopping without calling unimplemented auth endpoints).

### 4. Start the development server
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
npm run preview
```

---

## Project Structure

```text
frontend/
├── public/
│   ├── logo.svg
│   ├── favicon.ico
│   └── images/products/
├── src/
│   ├── components/
│   │   ├── account/       # ProfileSection, PreferencesSection, SavedProducts, OrderHistory
│   │   ├── auth/          # LoginForm, RegisterForm, OnboardingModal, ProtectedRoute
│   │   ├── chat/          # ChatWindow, ChatMessage, ChatInput, TypingIndicator, SuggestedPrompts
│   │   ├── checkout/      # CostBreakdown, ShippingDetails, CurrencyDetails, DeliveryEstimate, PurchaseApproval, PayPalButton
│   │   ├── common/        # Navbar, Footer, Button, Loader, ErrorMessage, EmptyState, ProductImage
│   │   ├── currency/      # CountrySelector, CurrencySelector
│   │   ├── products/      # ProductCard, ProductGrid, ProductComparison, ProductFilters, ProductDetails
│   │   └── ui/            # shadcn/ui Radix primitives
│   ├── context/           # CurrencyContext, AppContext, AuthContext, CartContext, ChatContext, ToastContext
│   ├── hooks/             # useAuth, useCurrency, useChat, useProducts
│   ├── mocks/             # Isolated mock auth, products, FX rates, shipping, checkout, agent & orders
│   ├── pages/             # Home, Assistant, Results, Product, Checkout, OrderSuccess, Login, Register, ForgotPassword, AccountSettings, NotFound
│   ├── services/          # api.js, adapters.js, authService, userService, agentService, productService, currencyService, shippingService, paymentService, orderService
│   ├── styles/            # globals.css
│   └── utils/             # cn.js, currencyFormatter.js, formatPrice.js, validators.js
├── .env.example
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## Required FastAPI Backend API Contracts

All endpoints share base URL `VITE_API_BASE_URL` (default: `http://localhost:8000/api`). Frontend adapters in `src/services/adapters.js` accept both `snake_case` and `camelCase` keys.

### 1. `POST /api/agent/chat`
- **Request:**
  ```json
  {
    "message": "I want to buy Sony WH-1000XM5 headphones from the USA and deliver them to India. My budget is ₹25,000.",
    "conversation_id": "optional-string-or-null",
    "destination_country": "IN",
    "preferred_currency": "INR"
  }
  ```
- **Response:**
  ```json
  {
    "conversation_id": "conv_123",
    "reply": "Markdown-friendly conversational assistant response",
    "products": [],
    "follow_up_prompts": ["Compare options side by side"],
    "intent": { "detectedOrigin": "US", "detectedDestination": "IN", "currency": "INR" }
  }
  ```

### 2. `POST /api/products/search`
- **Request:**
  ```json
  {
    "query": "Sony WH-1000XM5",
    "destination_country": "IN",
    "preferred_currency": "INR",
    "origin_country": "US",
    "in_stock_only": false,
    "max_budget": 25000,
    "sort_by": "landed_asc"
  }
  ```
- **Response:** `{ "products": [...], "total": 4, "currency": "INR", "destination_country": "IN" }`

### 3. `GET /api/products/{id}`
- **Query Params:** `?destination_country=IN&preferred_currency=INR`
- **Response:** Normalized product object with `id`, `title`, `merchant: { name, country, verified, rating }`, `original_price`, `original_currency`, `converted_price`, `target_currency`, `exchange_rate`, `shipping_cost`, `total_landed_cost`, `delivery_estimate`, `availability`, `rating`, `image_url`, `description`, `highlights`.

### 4. `POST /api/currency/convert`
- **Request:** `{ "amount": 278.0, "from_currency": "USD", "to_currency": "INR" }`
- **Response:** `{ "original_amount": 278.0, "converted_amount": 23491.0, "from_currency": "USD", "to_currency": "INR", "rate": 84.5, "timestamp": "..." }`

### 5. `POST /api/shipping/check`
- **Request:** `{ "product_id": "prod-1", "origin_country": "US", "destination_country": "IN", "target_currency": "INR", "quantity": 1 }`
- **Response:** `{ "available": true, "reason": null, "origin_country": "US", "destination_country": "IN", "options": [...], "default_option": {...} }`

### 6. `POST /api/checkout/calculate`
- **Request:** `{ "product_id": "prod-1", "quantity": 1, "destination_country": "IN", "target_currency": "INR", "shipping_option_id": "ship-standard-intl", "shipping_address": {...} }`
- **Response:**
  ```json
  {
    "checkout_session_id": "chk_abc123",
    "shipping_available": true,
    "origin_country": "US",
    "destination_country": "IN",
    "original_currency": "USD",
    "original_subtotal": 278.0,
    "target_currency": "INR",
    "exchange_rate": 84.5,
    "breakdown": {
      "product_price": 23491.0,
      "currency_conversion_fee": 352.37,
      "shipping_charges": 1647.75,
      "estimated_duties": 3016.65,
      "estimated_taxes": 5068.0,
      "tax_label": "IGST (18%)",
      "other_fees": 380.25,
      "other_fees_label": "Customs Brokerage & Carrier Handling",
      "total_payable": 33956.02,
      "paypal_settlement_currency": "USD",
      "paypal_settlement_amount": 401.85
    },
    "shipping_option": { "id": "ship-standard-intl", "carrier": "DHL", "etaLabel": "5-8 business days" },
    "warnings": ["Import duties and taxes are estimates..."]
  }
  ```

### 7. `POST /api/checkout/create`
- **Request:** `{ "checkout_session_id": "chk_abc123", "product_id": "prod-1", "quantity": 1, "destination_country": "IN", "target_currency": "INR", "shipping_option_id": "...", "shipping_address": {...}, "user_approved": true }`
- **Response:** `{ "order_id": "ZEN-1001", "paypal_order_id": "5O190127TN364715T", "status": "CREATED" }`

### 8. `POST /api/checkout/capture`
- **Request:** `{ "paypal_order_id": "5O190127TN364715T", "order_id": "ZEN-1001" }`
- **Response:** Verified order object (`order_id`, `paypal_order_id`, `paypal_transaction_id`, `status: "COMPLETED" | "PENDING" | "FAILED"`, `total_amount`, `currency`, `delivery_estimate`, `product_title`, `merchant_name`, `shipping_address`).

### 9. `GET /api/orders/{id}`
- **Response:** Same normalized verified order schema as `/checkout/capture`.

### 10. Authentication & User Personalization Endpoints (`VITE_ENABLE_BACKEND_AUTH=true`)
See [`../docs/api_documentation.md`](../docs/api_documentation.md) for full request/response schemas and cookie-session requirements covering:
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/forgot-password`
- `GET /api/users/profile`, `PUT /api/users/profile`, `PUT /api/users/preferences`
- `GET /api/users/saved-products`, `POST /api/users/saved-products`, `DELETE /api/users/saved-products/{id}`
- `GET /api/users/orders`

