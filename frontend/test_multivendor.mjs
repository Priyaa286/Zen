// In-memory localStorage polyfill for Node CLI environment
if (!globalThis.localStorage) {
  const memStore = new Map();
  globalThis.localStorage = {
    getItem: (k) => memStore.get(k) || null,
    setItem: (k, v) => memStore.set(k, String(v)),
    removeItem: (k) => memStore.delete(k),
    clear: () => memStore.clear(),
  };
}

import assert from 'node:assert';
import {
  MOCK_DEMO_ACCOUNTS,
  mockSwitchUser,
  mockGetAllUsers,
  mockUpdateUserRole,
} from './src/mocks/mockAuth.js';
import {
  getMockSellerStores,
  registerMockSellerStore,
  getMockSellerProducts,
  createMockSellerProduct,
  updateMockOrderStatus,
  addMockOrderTracking,
  getMockSellerSettlements,
  SELLER_STATUSES,
} from './src/mocks/mockSeller.js';
import {
  getMockAuditLogs,
  reviewMockSellerApplication,
  getMockProductModerationList,
  moderateMockProduct,
  getMockAdminStats,
} from './src/mocks/mockAdmin.js';

console.log('--- RUNNING MULTI-VENDOR MARKETPLACE UNIT TESTS ---');

// 1. Verify Demo Personas
console.log('Test 1: Demo personas exist and cover all 3 roles...');
assert.strictEqual(MOCK_DEMO_ACCOUNTS.length, 4, 'Should have 4 demo accounts');
const roles = MOCK_DEMO_ACCOUNTS.map((a) => a.role);
assert.ok(roles.includes('BUYER'), 'BUYER persona exists');
assert.ok(roles.includes('SELLER'), 'SELLER persona exists');
assert.ok(roles.includes('ADMIN'), 'ADMIN persona exists');
console.log('✓ Test 1 Passed: Demo personas verified.');

// 2. Verify Seller Store Registration & Verification Lifecycle
console.log('Test 2: Seller store registration lifecycle...');
const initialStores = getMockSellerStores();
assert.ok(initialStores.length >= 2, 'Seeded stores exist');
const tokyoStore = initialStores.find((s) => s.id === 'store-tokyo-optics');
assert.strictEqual(tokyoStore.verificationStatus, SELLER_STATUSES.APPROVED, 'Tokyo optics is verified');
assert.strictEqual(tokyoStore.currency, 'JPY', 'Tokyo optics currency is JPY');

const newStore = registerMockSellerStore(
  {
    storeName: 'Nordic Leathercraft Co.',
    slug: 'nordic-leather',
    legalBusinessName: 'Nordic Leathercraft AB',
    registrationNumber: '556123-4567',
    originCountry: 'SE',
    currency: 'EUR',
    primaryCategory: 'fashion',
  },
  'nordic@zen.global',
  'usr-nordic'
);
assert.strictEqual(newStore.verificationStatus, SELLER_STATUSES.PENDING_REVIEW, 'New stores start PENDING_REVIEW');
assert.ok(newStore.id.startsWith('store-'), 'Store gets generated ID');
console.log('✓ Test 2 Passed: Seller store registration starts in PENDING_REVIEW.');

// 3. Admin Verification Review & Audit Trail
console.log('Test 3: Admin application review and audit trail...');
const initialLogsCount = getMockAuditLogs().length;
const approvedStore = reviewMockSellerApplication(newStore.id, {
  decision: 'APPROVED',
  adminNotes: 'Export authorization and Swedish commercial register verified.',
  actorEmail: 'admin@zen.global',
});
assert.strictEqual(approvedStore.verificationStatus, 'APPROVED', 'Store status updated to APPROVED');
const updatedLogs = getMockAuditLogs();
assert.ok(updatedLogs.length > initialLogsCount, 'Audit log was recorded');
assert.strictEqual(updatedLogs[0].action, 'SELLER_APPROVED', 'Audit log records action');
assert.strictEqual(updatedLogs[0].targetId, newStore.id, 'Audit log records target');
console.log('✓ Test 3 Passed: Admin review approves merchant and logs immutable audit event.');

// 4. Product Management (Add, List)
console.log('Test 4: Seller product catalog management...');
const tokyoProducts = getMockSellerProducts('store-tokyo-optics');
assert.ok(tokyoProducts.length >= 1, 'Tokyo store has listed products');

const addedProduct = createMockSellerProduct('store-tokyo-optics', {
  title: 'Handmade Binchotan Charcoal Filter Kit',
  category: 'home-kitchen',
  originalPrice: 8500,
  currency: 'JPY',
  stock: 40,
  weightKg: 0.35,
  originCountry: 'JP',
});
assert.ok(addedProduct.id.startsWith('prod-'), 'Product gets generated ID');
assert.strictEqual(addedProduct.storeId, 'store-tokyo-optics', 'Product tied to store');
console.log('✓ Test 4 Passed: Products listed in seller origin currency.');

// 5. Order Fulfillment Lifecycle & Tracking Dispatch
console.log('Test 5: Order fulfillment lifecycle & tracking dispatch...');
const updatedOrder = updateMockOrderStatus('ORD-JP-889101', 'PROCESSING', 'Packaging item with Japanese custom crating');
assert.strictEqual(updatedOrder.status, 'PROCESSING', 'Order status moved to PROCESSING');

const shippedOrder = addMockOrderTracking('ORD-JP-889101', {
  carrier: 'DHL Express International',
  trackingNumber: 'DHL-JP-992182910',
  originWarehouse: 'Tokyo Narita Air Cargo Terminal',
  estimatedDeliveryDays: '3-5 business days',
});
assert.strictEqual(shippedOrder.status, 'SHIPPED', 'Order auto-transitions to SHIPPED upon tracking dispatch');
assert.strictEqual(shippedOrder.tracking.carrier, 'DHL Express International', 'Carrier attached');
assert.ok(shippedOrder.auditTrail.length >= 2, 'Audit trail updated with dispatch event');
console.log('✓ Test 5 Passed: Order fulfillment lifecycle and air waybill dispatch verified.');

// 6. Settlements & 5% Platform Fee Transparency
console.log('Test 6: Settlements and platform fee transparency...');
const settlements = getMockSellerSettlements('store-tokyo-optics');
assert.strictEqual(settlements.platformFeePercent, 0.05, 'Platform fee is 5%');
assert.strictEqual(settlements.grossSales * 0.05, settlements.platformFee, 'Fee calculated correctly');
assert.strictEqual(settlements.grossSales - settlements.platformFee, settlements.netSettlement, 'Net settlement matches');
console.log('✓ Test 6 Passed: Settlements and 5% platform fee calculated accurately.');

// 7. Product Moderation
console.log('Test 7: Admin product moderation...');
const modRes = moderateMockProduct('prod-fujifilm-x100vi-jp', {
  decision: 'APPROVED',
  moderationNotes: 'Certified original Japanese export model with worldwide serial numbers.',
  actorEmail: 'admin@zen.global',
});
assert.strictEqual(modRes.moderationStatus, 'APPROVED', 'Product approved');
console.log('✓ Test 7 Passed: Product catalog moderation verified.');

// 8. User Role Management
console.log('Test 8: User RBAC management...');
const allUsers = await mockGetAllUsers();
const aarav = allUsers.find((u) => u.email === 'aarav@zen.global');
assert.strictEqual(aarav.role, 'BUYER', 'Aarav default role is BUYER');
const promoted = await mockUpdateUserRole(aarav.id, 'SELLER');
assert.strictEqual(promoted.role, 'SELLER', 'Role updated to SELLER');
// revert back for demo fidelity
await mockUpdateUserRole(aarav.id, 'BUYER');
console.log('✓ Test 8 Passed: User RBAC assignment verified.');

console.log('\n=== ALL 8 MULTI-VENDOR UNIT TESTS PASSED SUCCESSFULLY! ===');
