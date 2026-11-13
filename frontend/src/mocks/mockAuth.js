/**
 * Mock Authentication & User Personalization Store (Isolated Frontend Mock Layer)
 * Used ONLY when VITE_USE_MOCK_API is enabled.
 * Passwords are salted and digested with SHA-256 before persistence (never stored in plaintext).
 */
import { MOCK_PRODUCTS } from './mockProducts.js';
import { getAllMockOrders } from './mockOrders.js';

const USERS_KEY = 'zen_mock_users_v1';
const PERSISTENT_SESSION_KEY = 'zen_mock_session_v1';
const EPHEMERAL_SESSION_KEY = 'zen_mock_session_temp_v1';

const SEEDED_USER_ID = 'usr-demo-aarav';

export const MOCK_DEMO_CREDENTIALS = {
  email: 'aarav@zen.global',
  password: 'ZenDemo@2026',
};

export const MOCK_DEMO_ACCOUNTS = [
  {
    role: 'BUYER',
    label: 'Buyer (Aarav Sharma)',
    email: 'aarav@zen.global',
    password: 'ZenDemo@2026',
    description: 'International shopper based in India with INR currency preferences.',
  },
  {
    role: 'SELLER',
    label: 'Verified Merchant (Tokyo Optics & Craft)',
    email: 'seller@zen.global',
    password: 'ZenSeller@2026',
    description: 'Approved Japanese seller managing products, air freight, and orders.',
  },
  {
    role: 'SELLER',
    label: 'Pending Merchant (Berlin Sound GmbH)',
    email: 'pending.seller@zen.global',
    password: 'ZenPending@2026',
    description: 'Unverified seller waiting for compliance document review.',
  },
  {
    role: 'ADMIN',
    label: 'Platform Admin (Zen Compliance)',
    email: 'admin@zen.global',
    password: 'ZenAdmin@2026',
    description: 'Marketplace administrator with merchant approval and moderation rights.',
  },
];

async function hashPassword(password, salt) {
  const input = `zen-salt:${salt}:${password}`;
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const data = new TextEncoder().encode(input);
      const buf = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // SubtleCrypto unavailable in non-secure test contexts; fall through to deterministic hash
  }
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ ch, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

function createInitialSeedUser(passwordHash) {
  return {
    id: SEEDED_USER_ID,
    fullName: 'Aarav Sharma',
    email: 'aarav@zen.global',
    role: 'BUYER',
    passwordSalt: 'seed-v1',
    passwordHash,
    residenceCountry: 'IN',
    preferredCurrency: 'INR',
    defaultDeliveryCountry: 'IN',
    onboardingCompleted: true,
    preferences: {
      residenceCountry: 'IN',
      preferredCurrency: 'INR',
      defaultDeliveryCountry: 'IN',
      showOriginalPriceBadge: true,
      compactCurrencyFormat: false,
    },
    savedProductIds: ['prod-sony-xm5-amazon-us', 'prod-fujifilm-x100vi-jp'],
    savedAddresses: [
      {
        fullName: 'Aarav Sharma',
        email: 'aarav@zen.global',
        phone: '+91 98450 12345',
        addressLine1: '42 Indiranagar 100ft Rd, HAL 2nd Stage',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560038',
        countryCode: 'IN',
      },
    ],
    searchHistory: [
      {
        id: 'hist-1',
        query: 'Sony WH-1000XM5 headphones from USA under ₹25,000',
        destinationCountry: 'IN',
        preferredCurrency: 'INR',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'hist-2',
        query: 'Fujifilm X100VI camera shipped from Tokyo',
        destinationCountry: 'IN',
        preferredCurrency: 'INR',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    orders: [
      {
        orderId: 'ZEN-MOCK-441092',
        paypalOrderId: 'PAYPAL-SANDBOX-9A4120K',
        paypalTransactionId: 'TXN-SANDBOX-8891KZ',
        status: 'COMPLETED',
        statusReason: 'Mock Preview Only — Historical sample verified order.',
        productTitle: 'Kindle Paperwhite Signature Edition (32 GB, Agave Green)',
        merchantName: 'Amazon US Global Store',
        quantity: 1,
        totalAmount: 21885.42,
        currency: 'INR',
        deliveryEstimate: 'Delivered · 5–8 business days',
        shippingAddress: {
          fullName: 'Aarav Sharma',
          city: 'Bengaluru',
          countryCode: 'IN',
        },
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        isMock: true,
        source: 'mock',
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    isMock: true,
    source: 'mock',
  };
}

async function createInitialSellerUser(passwordHash) {
  return {
    id: 'usr-seller-tokyo',
    fullName: 'Kenji Sato',
    email: 'seller@zen.global',
    role: 'SELLER',
    storeId: 'store-tokyo-optics',
    storeName: 'Tokyo Optics & Craft',
    verificationStatus: 'APPROVED',
    passwordSalt: 'seed-seller-v1',
    passwordHash,
    residenceCountry: 'JP',
    preferredCurrency: 'JPY',
    defaultDeliveryCountry: 'JP',
    onboardingCompleted: true,
    preferences: {
      residenceCountry: 'JP',
      preferredCurrency: 'JPY',
      defaultDeliveryCountry: 'JP',
      showOriginalPriceBadge: true,
      compactCurrencyFormat: false,
    },
    savedProductIds: [],
    savedAddresses: [],
    searchHistory: [],
    orders: [],
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    isMock: true,
    source: 'mock',
  };
}

async function createPendingSellerUser(passwordHash) {
  return {
    id: 'usr-seller-berlin',
    fullName: 'Lukas Weber',
    email: 'pending.seller@zen.global',
    role: 'SELLER',
    storeId: 'store-berlin-audio',
    storeName: 'Berlin Audio Works',
    verificationStatus: 'PENDING_REVIEW',
    passwordSalt: 'seed-pending-v1',
    passwordHash,
    residenceCountry: 'DE',
    preferredCurrency: 'EUR',
    defaultDeliveryCountry: 'DE',
    onboardingCompleted: true,
    preferences: {
      residenceCountry: 'DE',
      preferredCurrency: 'EUR',
      defaultDeliveryCountry: 'DE',
      showOriginalPriceBadge: true,
      compactCurrencyFormat: false,
    },
    savedProductIds: [],
    savedAddresses: [],
    searchHistory: [],
    orders: [],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    isMock: true,
    source: 'mock',
  };
}

async function createInitialAdminUser(passwordHash) {
  return {
    id: 'usr-admin-compliance',
    fullName: 'Zen Compliance Team',
    email: 'admin@zen.global',
    role: 'ADMIN',
    passwordSalt: 'seed-admin-v1',
    passwordHash,
    residenceCountry: 'US',
    preferredCurrency: 'USD',
    defaultDeliveryCountry: 'US',
    onboardingCompleted: true,
    preferences: {
      residenceCountry: 'US',
      preferredCurrency: 'USD',
      defaultDeliveryCountry: 'US',
      showOriginalPriceBadge: true,
      compactCurrencyFormat: false,
    },
    savedProductIds: [],
    savedAddresses: [],
    searchHistory: [],
    orders: [],
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
    isMock: true,
    source: 'mock',
  };
}

function readUsersMap() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeUsersMap(map) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
}

async function ensureSeededUser() {
  const users = readUsersMap();
  let changed = false;

  if (!users['aarav@zen.global'] || !users['aarav@zen.global'].role) {
    const hash = await hashPassword('ZenDemo@2026', 'seed-v1');
    users['aarav@zen.global'] = createInitialSeedUser(hash);
    changed = true;
  }

  if (!users['seller@zen.global']) {
    const hash = await hashPassword('ZenSeller@2026', 'seed-seller-v1');
    users['seller@zen.global'] = await createInitialSellerUser(hash);
    changed = true;
  }

  if (!users['pending.seller@zen.global']) {
    const hash = await hashPassword('ZenPending@2026', 'seed-pending-v1');
    users['pending.seller@zen.global'] = await createPendingSellerUser(hash);
    changed = true;
  }

  if (!users['admin@zen.global']) {
    const hash = await hashPassword('ZenAdmin@2026', 'seed-admin-v1');
    users['admin@zen.global'] = await createInitialAdminUser(hash);
    changed = true;
  }

  if (changed) {
    writeUsersMap(users);
  }
  return users;
}

function sanitizeUserRecord(record) {
  if (!record) return null;
  const { passwordHash, passwordSalt, ...safe } = record;
  return {
    ...safe,
    isMock: true,
    source: 'mock',
  };
}

function writeSession(email, rememberMe) {
  try {
    if (rememberMe) {
      localStorage.setItem(PERSISTENT_SESSION_KEY, JSON.stringify({ email }));
      sessionStorage.removeItem(EPHEMERAL_SESSION_KEY);
    } else {
      sessionStorage.setItem(EPHEMERAL_SESSION_KEY, JSON.stringify({ email }));
      localStorage.removeItem(PERSISTENT_SESSION_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

function readActiveSessionEmail() {
  try {
    const ep = sessionStorage.getItem(EPHEMERAL_SESSION_KEY);
    if (ep) return JSON.parse(ep)?.email || null;
    const per = localStorage.getItem(PERSISTENT_SESSION_KEY);
    if (per) return JSON.parse(per)?.email || null;
  } catch {
    // Ignore parse errors
  }
  return null;
}

function clearSessionStorage() {
  try {
    localStorage.removeItem(PERSISTENT_SESSION_KEY);
    sessionStorage.removeItem(EPHEMERAL_SESSION_KEY);
  } catch {
    // Ignore errors
  }
}

export async function mockRegister({
  fullName,
  email,
  password,
  residenceCountry = 'IN',
  preferredCurrency = 'INR',
}) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const users = await ensureSeededUser();

  if (users[normalizedEmail]) {
    const err = new Error('An account with this email address already exists.');
    err.status = 409;
    throw err;
  }

  const salt = Math.random().toString(36).slice(2, 10);
  const passwordHash = await hashPassword(password, salt);
  const country = String(residenceCountry || 'IN').toUpperCase();
  const currency = String(preferredCurrency || 'INR').toUpperCase();

  const newUser = {
    id: `usr-${Date.now().toString(36)}`,
    fullName: String(fullName || '').trim(),
    email: normalizedEmail,
    role: 'BUYER',
    passwordSalt: salt,
    passwordHash,
    residenceCountry: country,
    preferredCurrency: currency,
    defaultDeliveryCountry: country,
    onboardingCompleted: false,
    preferences: {
      residenceCountry: country,
      preferredCurrency: currency,
      defaultDeliveryCountry: country,
      showOriginalPriceBadge: true,
      compactCurrencyFormat: false,
    },
    savedProductIds: [],
    savedAddresses: [],
    searchHistory: [],
    orders: [],
    createdAt: new Date().toISOString(),
    isMock: true,
    source: 'mock',
  };

  users[normalizedEmail] = newUser;
  writeUsersMap(users);
  writeSession(normalizedEmail, true);
  return sanitizeUserRecord(newUser);
}

export async function mockLogin({ email, password, rememberMe = true }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const users = await ensureSeededUser();
  const existing = users[normalizedEmail];

  if (!existing) {
    const err = new Error("That email or password doesn't look right.");
    err.status = 401;
    throw err;
  }

  const candidateHash = await hashPassword(password || '', existing.passwordSalt || 'seed-v1');
  if (candidateHash !== existing.passwordHash) {
    const err = new Error("That email or password doesn't look right.");
    err.status = 401;
    throw err;
  }

  writeSession(normalizedEmail, rememberMe);
  return sanitizeUserRecord(existing);
}

export async function mockGetCurrentUser() {
  const email = readActiveSessionEmail();
  if (!email) return null;
  const users = await ensureSeededUser();
  return sanitizeUserRecord(users[email]);
}

export async function mockLogout() {
  clearSessionStorage();
  return { ok: true };
}

export async function mockForgotPassword({ email }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  await ensureSeededUser();
  return {
    accepted: true,
    message: `If an account matches ${normalizedEmail}, password reset instructions would be sent (Mock Preview simulation).`,
  };
}

async function getMutableCurrentRecord() {
  const email = readActiveSessionEmail();
  if (!email) {
    const err = new Error('Please sign in to continue.');
    err.status = 401;
    throw err;
  }
  const users = await ensureSeededUser();
  const record = users[email];
  if (!record) {
    clearSessionStorage();
    const err = new Error('Session expired. Please sign in again.');
    err.status = 401;
    throw err;
  }
  return { users, email, record };
}

export async function mockUpdateProfile(updates = {}) {
  const { users, email, record } = await getMutableCurrentRecord();
  const nextResidence = updates.residenceCountry
    ? String(updates.residenceCountry).toUpperCase()
    : record.residenceCountry;

  const nextRecord = {
    ...record,
    fullName: updates.fullName ? String(updates.fullName).trim() : record.fullName,
    residenceCountry: nextResidence,
    preferences: {
      ...record.preferences,
      residenceCountry: nextResidence,
    },
  };
  users[email] = nextRecord;
  writeUsersMap(users);
  return sanitizeUserRecord(nextRecord);
}

export async function mockUpdatePreferences(prefs = {}) {
  const { users, email, record } = await getMutableCurrentRecord();

  const residenceCountry = String(
    prefs.residenceCountry || record.residenceCountry || 'IN'
  ).toUpperCase();
  const preferredCurrency = String(
    prefs.preferredCurrency || record.preferredCurrency || 'INR'
  ).toUpperCase();
  const defaultDeliveryCountry = String(
    prefs.defaultDeliveryCountry || record.defaultDeliveryCountry || residenceCountry
  ).toUpperCase();

  const nextPreferences = {
    ...record.preferences,
    residenceCountry,
    preferredCurrency,
    defaultDeliveryCountry,
    showOriginalPriceBadge:
      prefs.showOriginalPriceBadge ?? record.preferences?.showOriginalPriceBadge ?? true,
    compactCurrencyFormat:
      prefs.compactCurrencyFormat ?? record.preferences?.compactCurrencyFormat ?? false,
  };

  const nextRecord = {
    ...record,
    residenceCountry,
    preferredCurrency,
    defaultDeliveryCountry,
    onboardingCompleted:
      prefs.onboardingCompleted !== undefined
        ? Boolean(prefs.onboardingCompleted)
        : record.onboardingCompleted,
    preferences: nextPreferences,
  };

  users[email] = nextRecord;
  writeUsersMap(users);
  return sanitizeUserRecord(nextRecord);
}

export async function mockGetSavedProductIds() {
  const { record } = await getMutableCurrentRecord();
  return Array.isArray(record.savedProductIds) ? [...record.savedProductIds] : [];
}

export async function mockSaveProduct(productId) {
  const { users, email, record } = await getMutableCurrentRecord();
  const current = Array.isArray(record.savedProductIds) ? record.savedProductIds : [];
  if (!current.includes(productId)) {
    record.savedProductIds = [productId, ...current];
    users[email] = record;
    writeUsersMap(users);
  }
  return [...record.savedProductIds];
}

export async function mockRemoveSavedProduct(productId) {
  const { users, email, record } = await getMutableCurrentRecord();
  const current = Array.isArray(record.savedProductIds) ? record.savedProductIds : [];
  record.savedProductIds = current.filter((id) => id !== productId);
  users[email] = record;
  writeUsersMap(users);
  return [...record.savedProductIds];
}

export async function mockSaveAddress(address) {
  const { users, email, record } = await getMutableCurrentRecord();
  const list = Array.isArray(record.savedAddresses) ? record.savedAddresses : [];
  const next = [
    address,
    ...list.filter(
      (a) =>
        !(
          a.addressLine1 === address.addressLine1 &&
          a.postalCode === address.postalCode
        )
    ),
  ].slice(0, 4);
  record.savedAddresses = next;
  users[email] = record;
  writeUsersMap(users);
  return next;
}

export async function mockRecordSearch(entry) {
  const { users, email, record } = await getMutableCurrentRecord();
  const hist = Array.isArray(record.searchHistory) ? record.searchHistory : [];
  const nextItem = {
    id: `hist-${Date.now().toString(36)}`,
    query: entry.query,
    destinationCountry: entry.destinationCountry,
    preferredCurrency: entry.preferredCurrency,
    timestamp: new Date().toISOString(),
  };
  record.searchHistory = [nextItem, ...hist.filter((h) => h.query !== entry.query)].slice(0, 12);
  users[email] = record;
  writeUsersMap(users);
  return record.searchHistory;
}

export async function mockGetUserOrders() {
  const { record } = await getMutableCurrentRecord();
  const sessionOrders = getAllMockOrders(record.id);
  const storedOrders = Array.isArray(record.orders) ? record.orders : [];
  const byId = new Map();
  [...sessionOrders, ...storedOrders].forEach((o) => {
    if (o?.orderId && !byId.has(o.orderId)) {
      byId.set(o.orderId, o);
    }
  });
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

export function getMockProductByIdRaw(productId) {
  return MOCK_PRODUCTS.find((p) => p.id === productId) || null;
}

export async function mockUpgradeToSellerStore(store) {
  const { users, email, record } = await getMutableCurrentRecord();
  const updated = {
    ...record,
    role: 'SELLER',
    storeId: store.id,
    storeName: store.storeName,
    verificationStatus: store.verificationStatus,
    updatedAt: new Date().toISOString(),
  };
  users[email] = updated;
  writeUsersMap(users);
  return sanitizeUserRecord(updated);
}

export async function mockGetAllUsers() {
  const users = await ensureSeededUser();
  return Object.values(users).map(sanitizeUserRecord);
}

export async function mockUpdateUserRole(userId, newRole) {
  const users = await ensureSeededUser();
  const entry = Object.entries(users).find(([, u]) => u.id === userId);
  if (!entry) throw new Error('User not found.');
  const [email, user] = entry;
  user.role = newRole;
  user.updatedAt = new Date().toISOString();
  users[email] = user;
  writeUsersMap(users);
  return sanitizeUserRecord(user);
}

export async function mockSwitchUser(email) {
  const users = await ensureSeededUser();
  const target = users[String(email).toLowerCase()];
  if (!target) throw new Error('Demo account not found.');
  writeSession(target.email, true);
  return sanitizeUserRecord(target);
}
