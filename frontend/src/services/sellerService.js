/**
 * Seller & Multi-Vendor Store Service
 * Coordinates with FastAPI backend (/api/seller/* and /api/sellers/*) with fallback to isolated mock store in Mock Preview mode.
 */
import { apiClient, isMockModeActive } from './api';
import {
  registerMockSellerStore,
  getStoreByOwnerEmail,
  getStoreById,
  updateMockSellerStore,
  getMockSellerProducts,
  createMockSellerProduct,
  updateMockSellerProduct,
  deleteMockSellerProduct,
  getMockSellerOrders,
  updateMockOrderStatus,
  addMockOrderTracking,
  getMockSellerAnalytics,
  getMockSellerSettlements,
  getMockSellerTransactions,
  getMockSellerRevenueStatement,
  getMockSellerSalesAnalytics,
  getMockSellerCustomerCorridors,
  exportSellerReportCsv,
} from '@/mocks/mockSeller';
import { mockUpgradeToSellerStore } from '@/mocks/mockAuth';

export async function registerSellerStore(storeData, ownerUser) {
  if (isMockModeActive()) {
    const store = registerMockSellerStore(storeData, ownerUser.email, ownerUser.id);
    await mockUpgradeToSellerStore(store);
    return store;
  }
  const { data } = await apiClient.post('/sellers/register', storeData);
  return data?.store || data;
}

export async function getSellerStoreMe(ownerEmail) {
  if (isMockModeActive()) {
    return getStoreByOwnerEmail(ownerEmail);
  }
  const { data } = await apiClient.get('/sellers/me');
  return data?.store || data;
}

export async function updateSellerStore(storeId, updates) {
  if (isMockModeActive()) {
    return updateMockSellerStore(storeId, updates);
  }
  const { data } = await apiClient.put('/sellers/me', updates);
  return data?.store || data;
}

export async function getSellerProducts(storeId) {
  if (isMockModeActive()) {
    return getMockSellerProducts(storeId);
  }
  const { data } = await apiClient.get('/seller/products');
  return data?.products || [];
}

export async function createSellerProduct(storeId, productData) {
  if (isMockModeActive()) {
    return createMockSellerProduct(storeId, productData);
  }
  const { data } = await apiClient.post('/seller/products', productData);
  return data?.product || data;
}

export async function updateSellerProduct(productId, productData) {
  if (isMockModeActive()) {
    return updateMockSellerProduct(productId, productData);
  }
  const { data } = await apiClient.put(`/seller/products/${productId}`, productData);
  return data?.product || data;
}

export async function deleteSellerProduct(storeIdOrProductId, maybeProductId) {
  const prodId = maybeProductId || storeIdOrProductId;
  if (isMockModeActive()) {
    return deleteMockSellerProduct(prodId);
  }
  const { data } = await apiClient.delete(`/seller/products/${prodId}`);
  return data;
}

export async function getSellerOrders(storeId) {
  if (isMockModeActive()) {
    return getMockSellerOrders(storeId);
  }
  const { data } = await apiClient.get('/seller/orders');
  return data?.orders || [];
}

export async function updateSellerOrderStatus(orderId, nextStatus, note = '') {
  if (isMockModeActive()) {
    return updateMockOrderStatus(orderId, nextStatus, note);
  }
  const { data } = await apiClient.put(`/seller/orders/${orderId}/status`, {
    status: nextStatus,
    note,
  });
  return data?.order || data;
}

export async function addSellerOrderTracking(orderId, trackingPayload) {
  if (isMockModeActive()) {
    return addMockOrderTracking(orderId, trackingPayload);
  }
  const { data } = await apiClient.post(`/seller/orders/${orderId}/tracking`, trackingPayload);
  return data?.order || data;
}

export const updateOrderStatus = (storeIdOrOrderId, nextStatusOrOrderId, noteOrNextStatus, maybeNote) => {
  if (maybeNote !== undefined || (typeof nextStatusOrOrderId === 'string' && ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(noteOrNextStatus))) {
    return updateSellerOrderStatus(nextStatusOrOrderId, noteOrNextStatus, maybeNote || '');
  }
  return updateSellerOrderStatus(storeIdOrOrderId, nextStatusOrOrderId, noteOrNextStatus || '');
};

export const addOrderTracking = (storeIdOrOrderId, trackingOrOrderId, maybeTracking) => {
  if (maybeTracking !== undefined) {
    return addSellerOrderTracking(trackingOrOrderId, maybeTracking);
  }
  return addSellerOrderTracking(storeIdOrOrderId, trackingOrOrderId);
};

export async function getSellerAnalytics(storeId) {
  if (isMockModeActive()) {
    return getMockSellerAnalytics(storeId);
  }
  const { data } = await apiClient.get('/seller/analytics');
  return data;
}

export async function getSellerSettlements(storeId) {
  if (isMockModeActive()) {
    return getMockSellerSettlements(storeId);
  }
  const { data } = await apiClient.get('/seller/payments');
  return data;
}

export async function getSellerTransactions(storeId, filters = {}) {
  if (isMockModeActive()) {
    return getMockSellerTransactions(storeId, filters);
  }
  const { data } = await apiClient.get('/seller/transactions', { params: filters });
  return data;
}

export async function getSellerRevenueStatement(storeId, dateRange = '30d') {
  if (isMockModeActive()) {
    return getMockSellerRevenueStatement(storeId, dateRange);
  }
  const { data } = await apiClient.get('/seller/revenue/statement', { params: { date_range: dateRange } });
  return data;
}

export async function getSellerSalesAnalytics(storeId, dateRange = '30d') {
  if (isMockModeActive()) {
    return getMockSellerSalesAnalytics(storeId, dateRange);
  }
  const { data } = await apiClient.get('/seller/analytics/sales', { params: { date_range: dateRange } });
  return data;
}

export async function getSellerCustomerCorridors(storeId) {
  if (isMockModeActive()) {
    return getMockSellerCustomerCorridors(storeId);
  }
  const { data } = await apiClient.get('/seller/analytics/corridors');
  return data;
}

export function downloadSellerReportCsv(reportType, data, filename) {
  return exportSellerReportCsv(reportType, data, filename);
}
