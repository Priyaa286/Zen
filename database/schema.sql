-- =============================================================================
-- Zen Global Multi-Vendor International Marketplace Schema
-- PostgreSQL DDL with Multi-Tenant Isolation, Dual Currency & RBAC
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types
CREATE TYPE user_role AS ENUM ('BUYER', 'SELLER', 'ADMIN');
CREATE TYPE verification_status AS ENUM ('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE order_package_status AS ENUM ('NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED');
CREATE TYPE settlement_status AS ENUM ('PENDING_CLEARANCE', 'SCHEDULED', 'PAID', 'DISPUTED', 'CANCELLED');

-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'BUYER',
    residence_country VARCHAR(4) NOT NULL DEFAULT 'IN',
    preferred_currency VARCHAR(4) NOT NULL DEFAULT 'INR',
    default_delivery_country VARCHAR(4) NOT NULL DEFAULT 'IN',
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Merchant Stores Table
CREATE TABLE stores (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    legal_business_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(128) NOT NULL,
    tax_id VARCHAR(128),
    business_address TEXT,
    origin_country VARCHAR(4) NOT NULL DEFAULT 'JP',
    currency VARCHAR(4) NOT NULL DEFAULT 'JPY',
    primary_category VARCHAR(64) NOT NULL,
    description TEXT,
    verification_status verification_status NOT NULL DEFAULT 'PENDING_REVIEW',
    admin_notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(128),
    swift_bic VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_stores_status ON stores(verification_status);

-- 3. Store Verification Documents Table
CREATE TABLE store_verification_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id VARCHAR(64) NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    document_type VARCHAR(64) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    status verification_status NOT NULL DEFAULT 'PENDING_REVIEW',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Products Table (Multi-Vendor Catalog)
CREATE TABLE products (
    id VARCHAR(64) PRIMARY KEY,
    store_id VARCHAR(64) NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    title VARCHAR(512) NOT NULL,
    description TEXT,
    category VARCHAR(64) NOT NULL,
    original_currency VARCHAR(4) NOT NULL DEFAULT 'JPY',
    original_price NUMERIC(14, 2) NOT NULL CHECK (original_price > 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    weight_kg NUMERIC(8, 3) NOT NULL DEFAULT 0.500,
    origin_country VARCHAR(4) NOT NULL DEFAULT 'JP',
    image_url TEXT,
    moderation_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_origin ON products(origin_country);

-- 5. Consolidated Master Buyer Orders Table
CREATE TABLE orders (
    id VARCHAR(64) PRIMARY KEY,
    order_number VARCHAR(64) UNIQUE NOT NULL,
    buyer_id VARCHAR(64) NOT NULL REFERENCES users(id),
    destination_country VARCHAR(4) NOT NULL,
    settlement_currency VARCHAR(4) NOT NULL,
    subtotal_buyer_currency NUMERIC(14, 2) NOT NULL,
    shipping_total_buyer_currency NUMERIC(14, 2) NOT NULL,
    duties_total_buyer_currency NUMERIC(14, 2) NOT NULL,
    grand_total_buyer_currency NUMERIC(14, 2) NOT NULL,
    paypal_order_id VARCHAR(128),
    paypal_capture_id VARCHAR(128),
    payment_status VARCHAR(64) NOT NULL DEFAULT 'CAPTURED',
    shipping_address JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);

-- 6. Merchant Fulfillment Packages (Sub-Orders)
CREATE TABLE order_packages (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    store_id VARCHAR(64) NOT NULL REFERENCES stores(id),
    status order_package_status NOT NULL DEFAULT 'CONFIRMED',
    carrier VARCHAR(128),
    tracking_number VARCHAR(128),
    origin_warehouse VARCHAR(255),
    estimated_delivery_days VARCHAR(64),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    package_gross_seller_currency NUMERIC(14, 2) NOT NULL,
    package_platform_fee_seller_currency NUMERIC(14, 2) NOT NULL,
    package_net_seller_currency NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_packages_store ON order_packages(store_id);
CREATE INDEX idx_order_packages_order ON order_packages(order_id);

-- 7. Order Package Items Table
CREATE TABLE order_package_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id VARCHAR(64) NOT NULL REFERENCES order_packages(id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_seller_currency NUMERIC(14, 2) NOT NULL,
    unit_price_buyer_currency NUMERIC(14, 2) NOT NULL
);

-- 8. Merchant Financial Settlements Table
CREATE TABLE merchant_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id VARCHAR(64) NOT NULL REFERENCES stores(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    gross_sales NUMERIC(14, 2) NOT NULL DEFAULT 0,
    platform_fee_percent NUMERIC(5, 4) NOT NULL DEFAULT 0.05,
    platform_fee NUMERIC(14, 2) NOT NULL DEFAULT 0,
    refunds NUMERIC(14, 2) NOT NULL DEFAULT 0,
    net_settlement NUMERIC(14, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(4) NOT NULL,
    status settlement_status NOT NULL DEFAULT 'SCHEDULED',
    bank_reference VARCHAR(128),
    settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settlements_store ON merchant_settlements(store_id);

-- 9. Immutable Admin Audit Logs Table
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(128) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(128) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_actor ON admin_audit_logs(actor_email);
CREATE INDEX idx_audit_logs_target ON admin_audit_logs(target_type, target_id);

