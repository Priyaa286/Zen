/**
 * Mock Marketplace Administration Repository (Isolated Frontend Mock Layer)
 * Supports admin review, seller verification, product moderation, and audit trails.
 */
import {
  getMockSellerStores,
  updateMockSellerStore,
  SELLER_STATUSES,
} from './mockSeller.js';
import { MOCK_PRODUCTS } from './mockProducts.js';

const ADMIN_AUDIT_LOG_KEY = 'zen_mock_admin_audit_log_v2';
const ADMIN_MODERATION_KEY = 'zen_mock_admin_product_moderation_v2';

const SEEDED_AUDIT_LOGS = [
  {
    id: 'log-001',
    actorEmail: 'admin@zen.global',
    action: 'SELLER_APPROVED',
    targetType: 'STORE',
    targetId: 'store-tokyo-optics',
    details: 'Verified corporate registration and export documentation for Tokyo Optics & Craft.',
    timestamp: '2026-09-15T09:00:00.000Z',
  },
  {
    id: 'log-002',
    actorEmail: 'admin@zen.global',
    action: 'PRODUCT_APPROVED',
    targetType: 'PRODUCT',
    targetId: 'prod-fujifilm-x100vi-jp',
    details: 'Verified Japanese serial number format and authorized exporter documentation.',
    timestamp: '2026-09-16T11:20:00.000Z',
  },
  {
    id: 'log-003',
    actorEmail: 'system@zen.global',
    action: 'PAYPAL_SANDBOX_VERIFIED',
    targetType: 'PAYMENT_ENGINE',
    targetId: 'paypal-integration',
    details: 'Sandbox client and webhook signature verification initialized successfully.',
    timestamp: '2026-10-01T00:00:00.000Z',
  },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota safe
  }
}

export function getMockAuditLogs() {
  const existing = readJson(ADMIN_AUDIT_LOG_KEY, null);
  if (!existing || existing.length === 0) {
    writeJson(ADMIN_AUDIT_LOG_KEY, SEEDED_AUDIT_LOGS);
    return SEEDED_AUDIT_LOGS;
  }
  return existing;
}

export function recordAdminAuditLog({ actorEmail = 'admin@zen.global', action, targetType, targetId, details }) {
  const logs = getMockAuditLogs();
  const entry = {
    id: `log-${Date.now()}`,
    actorEmail,
    action,
    targetType,
    targetId,
    details,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(entry);
  writeJson(ADMIN_AUDIT_LOG_KEY, logs);
  return entry;
}

export function getMockAdminSellers() {
  return getMockSellerStores();
}

export function reviewMockSellerApplication(storeId, { decision, adminNotes, actorEmail = 'admin@zen.global' }) {
  const valid = [SELLER_STATUSES.APPROVED, SELLER_STATUSES.REJECTED, SELLER_STATUSES.SUSPENDED];
  if (!valid.includes(decision)) {
    throw new Error(`Invalid decision status: ${decision}`);
  }

  const updated = updateMockSellerStore(storeId, {
    verificationStatus: decision,
    adminNotes: adminNotes || `Review completed with status: ${decision}`,
    verifiedAt: decision === SELLER_STATUSES.APPROVED ? new Date().toISOString() : null,
  });

  recordAdminAuditLog({
    actorEmail,
    action: `SELLER_${decision}`,
    targetType: 'STORE',
    targetId: storeId,
    details: adminNotes || `Store verification status changed to ${decision}`,
  });

  return updated;
}

export function getMockProductModerationList() {
  const customOverrides = readJson(ADMIN_MODERATION_KEY, {});
  return MOCK_PRODUCTS.slice(0, 15).map((p) => ({
    ...p,
    moderationStatus: customOverrides[p.id]?.moderationStatus || 'APPROVED',
    moderationNotes: customOverrides[p.id]?.moderationNotes || 'Meets international authenticity standards.',
  }));
}

export function moderateMockProduct(productId, { decision, moderationNotes, actorEmail = 'admin@zen.global' }) {
  const customOverrides = readJson(ADMIN_MODERATION_KEY, {});
  customOverrides[productId] = {
    moderationStatus: decision, // 'APPROVED' | 'REJECTED' | 'ARCHIVED'
    moderationNotes: moderationNotes || `Moderated by admin with decision: ${decision}`,
    moderatedAt: new Date().toISOString(),
  };
  writeJson(ADMIN_MODERATION_KEY, customOverrides);

  recordAdminAuditLog({
    actorEmail,
    action: `PRODUCT_MODERATED_${decision}`,
    targetType: 'PRODUCT',
    targetId: productId,
    details: moderationNotes || `Product status set to ${decision}`,
  });

  return customOverrides[productId];
}

export function getMockAdminStats() {
  const stores = getMockSellerStores();
  const approvedStores = stores.filter((s) => s.verificationStatus === SELLER_STATUSES.APPROVED).length;
  const pendingStores = stores.filter((s) => s.verificationStatus === SELLER_STATUSES.PENDING_REVIEW).length;

  return {
    totalMerchants: stores.length,
    verifiedMerchants: approvedStores,
    pendingApplications: pendingStores,
    activeProducts: MOCK_PRODUCTS.length,
    totalGrossMerchandiseVolumeInr: 28450000,
    disputeRatePercent: 0.12,
    activeBuyerCountries: 10,
    activeSellerCorridors: 6,
  };
}
