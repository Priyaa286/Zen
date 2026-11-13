/**
 * Marketplace Admin Service
 * Coordinates with FastAPI backend (/api/admin/*) with seamless fallback to isolated mock admin in Mock Preview mode.
 */
import { apiClient, isMockModeActive } from './api';
import {
  getMockAdminStats,
  getMockAdminSellers,
  reviewMockSellerApplication,
  getMockProductModerationList,
  moderateMockProduct,
  getMockAuditLogs,
} from '@/mocks/mockAdmin';
import {
  mockGetAllUsers,
  mockUpdateUserRole,
} from '@/mocks/mockAuth';

export async function getAdminStats() {
  if (isMockModeActive()) {
    return getMockAdminStats();
  }
  const { data } = await apiClient.get('/admin/stats');
  return data?.stats || data;
}

export async function getAdminSellers() {
  if (isMockModeActive()) {
    return getMockAdminSellers();
  }
  const { data } = await apiClient.get('/admin/sellers');
  return data?.sellers || [];
}

export async function reviewSellerApplication(storeId, payload) {
  if (isMockModeActive()) {
    return reviewMockSellerApplication(storeId, payload);
  }
  const { data } = await apiClient.post(`/admin/sellers/${storeId}/review`, payload);
  return data?.store || data;
}

export async function getAdminProducts() {
  if (isMockModeActive()) {
    return getMockProductModerationList();
  }
  const { data } = await apiClient.get('/admin/products');
  return data?.products || [];
}

export async function moderateProduct(productId, payload) {
  if (isMockModeActive()) {
    return moderateMockProduct(productId, payload);
  }
  const { data } = await apiClient.post(`/admin/products/${productId}/moderate`, payload);
  return data?.result || data;
}

export async function getAdminUsers() {
  if (isMockModeActive()) {
    return mockGetAllUsers();
  }
  const { data } = await apiClient.get('/admin/users');
  return data?.users || [];
}

export async function updateUserRole(userId, newRole) {
  if (isMockModeActive()) {
    return mockUpdateUserRole(userId, newRole);
  }
  const { data } = await apiClient.put(`/admin/users/${userId}/role`, { role: newRole });
  return data?.user || data;
}

export async function getAdminAuditLogs() {
  if (isMockModeActive()) {
    return getMockAuditLogs();
  }
  const { data } = await apiClient.get('/admin/audit-logs');
  return data?.logs || [];
}

