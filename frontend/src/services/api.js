import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const API_ENDPOINTS = {
  AGENT_CHAT: '/agent/chat',
  PRODUCTS_SEARCH: '/products/search',
  PRODUCT_DETAIL: (id) => `/products/${encodeURIComponent(id)}`,
  CURRENCY_CONVERT: '/currency/convert',
  SHIPPING_CHECK: '/shipping/check',
  CHECKOUT_CALCULATE: '/checkout/calculate',
  CHECKOUT_CREATE: '/checkout/create',
  CHECKOUT_CAPTURE: '/checkout/capture',
  ORDER_DETAIL: (id) => `/orders/${encodeURIComponent(id)}`,

  // Proposed Authentication & User Account endpoints (Member 1 FastAPI contract)
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_ME: '/auth/me',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  USER_PROFILE: '/users/profile',
  USER_PREFERENCES: '/users/preferences',
  USER_SAVED_PRODUCTS: '/users/saved-products',
  USER_SAVED_PRODUCT_DETAIL: (id) => `/users/saved-products/${encodeURIComponent(id)}`,
  USER_ORDERS: '/users/orders',

  // Multi-Vendor Merchant & Admin endpoints (Member 1 FastAPI contract)
  SELLERS_REGISTER: '/sellers/register',
  SELLERS_ME: '/sellers/me',
  SELLER_PRODUCTS: '/seller/products',
  SELLER_PRODUCT_DETAIL: (id) => `/seller/products/${encodeURIComponent(id)}`,
  SELLER_ORDERS: '/seller/orders',
  SELLER_ORDER_STATUS: (id) => `/seller/orders/${encodeURIComponent(id)}/status`,
  SELLER_ORDER_TRACKING: (id) => `/seller/orders/${encodeURIComponent(id)}/tracking`,
  SELLER_ANALYTICS: '/seller/analytics',
  SELLER_SETTLEMENTS: '/seller/settlements',
  ADMIN_STATS: '/admin/stats',
  ADMIN_SELLERS: '/admin/sellers',
  ADMIN_SELLER_REVIEW: (id) => `/admin/sellers/${encodeURIComponent(id)}/review`,
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_MODERATE: (id) => `/admin/products/${encodeURIComponent(id)}/moderate`,
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_ROLE: (id) => `/admin/users/${encodeURIComponent(id)}/role`,
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
};

export const BACKEND_CAPABILITIES = {
  authImplemented:
    String(import.meta.env.VITE_ENABLE_BACKEND_AUTH ?? 'false').toLowerCase() === 'true',
  googleOAuthClientId: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || '',
};

const ENV_USE_MOCK = String(import.meta.env.VITE_USE_MOCK_API ?? 'true').toLowerCase() === 'true';

let runtimeMockOverride = null;

export function isMockApiEnabled() {
  if (typeof runtimeMockOverride === 'boolean') {
    return runtimeMockOverride;
  }
  return ENV_USE_MOCK;
}

export const isMockModeActive = isMockApiEnabled;

export function setRuntimeMockApi(enabled) {
  runtimeMockOverride = typeof enabled === 'boolean' ? enabled : null;
}

export class ApiServiceError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiServiceError';
    this.status = options.status ?? null;
    this.code = options.code ?? 'API_ERROR';
    this.isNetworkError = Boolean(options.isNetworkError);
    this.details = options.details ?? null;
  }
}

export function normalizeApiError(error, fallbackMessage = "We couldn't reach Zen right now. Please try again.") {
  if (error instanceof ApiServiceError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const isTimeout =
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      /timeout/i.test(error.message || '');
    const isNetworkError = !error.response && !isTimeout;
    const status = error.response?.status ?? null;
    const data = error.response?.data;

    let detailMessage = null;
    if (typeof data?.detail === 'string') {
      detailMessage = data.detail;
    } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
      detailMessage = data.detail
        .map((item) => {
          if (typeof item === 'string') return item;
          const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : null;
          return field && item?.msg ? `${field}: ${item.msg}` : item?.msg || null;
        })
        .filter(Boolean)
        .join('; ');
    }

    let friendlyMessage = fallbackMessage;
    if (isTimeout) {
      friendlyMessage =
        'The request timed out while waiting for the Zen backend. Please try again.';
    } else if (isNetworkError) {
      friendlyMessage =
        'Unable to reach the Zen backend service. Please verify the FastAPI server is running or switch to Mock Preview mode.';
    } else if (status === 404) {
      friendlyMessage = detailMessage || data?.message || 'The requested resource could not be found.';
    } else if (status === 422 || status === 400) {
      friendlyMessage =
        detailMessage ||
        data?.message ||
        'Please check the submitted request details and try again.';
    } else if (status >= 500) {
      friendlyMessage =
        detailMessage || data?.message || 'The backend encountered an internal error. Please try again shortly.';
    } else if (detailMessage || typeof data?.message === 'string') {
      friendlyMessage = detailMessage || data.message;
    }

    return new ApiServiceError(friendlyMessage, {
      status,
      code: data?.code || error.code || (isTimeout ? 'TIMEOUT' : 'HTTP_ERROR'),
      isNetworkError,
      details: data || null,
    });
  }

  return new ApiServiceError(
    error?.message || fallbackMessage,
    { code: 'UNKNOWN_ERROR' }
  );
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('zen_auth_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error))
);

export function simulateMockLatency(ms = 320) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default apiClient;

