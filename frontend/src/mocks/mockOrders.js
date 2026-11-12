/**
 * Mock Order Repository (Isolated Frontend Mock Layer)
 * Persists mock preview orders in sessionStorage strictly tagged `isMock: true`.
 */

const STORAGE_KEY = 'zen_mock_orders_v1';

function readStore() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(data) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota issues in restricted browsers
  }
}

export function saveMockOrder(order) {
  if (!order?.orderId) return order;
  const store = readStore();
  const stamped = {
    ...order,
    createdAt: order.createdAt || new Date().toISOString(),
    isMock: true,
    source: 'mock',
  };
  store[order.orderId] = stamped;
  writeStore(store);
  return stamped;
}

export function getMockOrderById(orderId) {
  if (!orderId) return null;
  const store = readStore();
  return store[orderId] || null;
}

export function getAllMockOrders(userId = null) {
  const store = readStore();
  const list = Object.values(store);
  const filtered = userId
    ? list.filter((o) => !o.userId || o.userId === userId)
    : list;
  return filtered.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}
