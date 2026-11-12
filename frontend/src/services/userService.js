import {
  apiClient,
  API_ENDPOINTS,
  ApiServiceError,
  BACKEND_CAPABILITIES,
  isMockApiEnabled,
  normalizeApiError,
  simulateMockLatency,
} from './api';
import { normalizeOrder, normalizeProduct, normalizeUser } from './adapters';
import { getProductById } from './productService';
import {
  mockGetCurrentUser,
  mockGetSavedProductIds,
  mockGetUserOrders,
  mockRecordSearch,
  mockRemoveSavedProduct,
  mockSaveAddress,
  mockSaveProduct,
  mockUpdatePreferences,
  mockUpdateProfile,
} from '@/mocks';

function assertBackendUserSupported() {
  if (!BACKEND_CAPABILITIES.authImplemented) {
    throw new ApiServiceError(
      'User account endpoints (/api/users/*) are not yet implemented on the FastAPI backend.',
      {
        status: 501,
        code: 'BACKEND_USERS_UNAVAILABLE',
      }
    );
  }
}

export async function getUserProfile() {
  if (isMockApiEnabled()) {
    await simulateMockLatency(180);
    const user = await mockGetCurrentUser();
    if (!user) {
      throw new ApiServiceError('Sign in required to view profile.', { status: 401 });
    }
    return normalizeUser(user, 'mock');
  }

  assertBackendUserSupported();

  try {
    const { data } = await apiClient.get(API_ENDPOINTS.USER_PROFILE);
    return normalizeUser(data?.profile ?? data?.user ?? data, 'live');
  } catch (err) {
    throw normalizeApiError(err, 'Unable to load user profile.');
  }
}

export async function updateUserProfile(updates) {
  if (isMockApiEnabled()) {
    await simulateMockLatency(220);
    const updated = await mockUpdateProfile(updates);
    return normalizeUser(updated, 'mock');
  }

  assertBackendUserSupported();

  try {
    const { data } = await apiClient.put(API_ENDPOINTS.USER_PROFILE, {
      full_name: updates.fullName,
      residence_country: updates.residenceCountry,
    });
    return normalizeUser(data?.profile ?? data?.user ?? data, 'live');
  } catch (err) {
    throw normalizeApiError(err, 'Unable to update profile details.');
  }
}

export async function updateUserPreferences(preferences) {
  if (isMockApiEnabled()) {
    await simulateMockLatency(220);
    const updated = await mockUpdatePreferences(preferences);
    return normalizeUser(updated, 'mock');
  }

  assertBackendUserSupported();

  try {
    const { data } = await apiClient.put(API_ENDPOINTS.USER_PREFERENCES, {
      residence_country: preferences.residenceCountry,
      preferred_currency: preferences.preferredCurrency,
      default_delivery_country: preferences.defaultDeliveryCountry,
      onboarding_completed: preferences.onboardingCompleted,
      show_original_price_badge: preferences.showOriginalPriceBadge,
      compact_currency_format: preferences.compactCurrencyFormat,
    });
    return normalizeUser(data?.user ?? data, 'live');
  } catch (err) {
    throw normalizeApiError(err, 'Unable to save shopping preferences.');
  }
}

export async function getSavedProducts({
  destinationCountry = 'IN',
  preferredCurrency = 'INR',
} = {}) {
  if (isMockApiEnabled()) {
    await simulateMockLatency(200);
    const ids = await mockGetSavedProductIds();
    const enriched = await Promise.all(
      ids.map((id) =>
        getProductById(id, { destinationCountry, preferredCurrency }).catch(() => null)
      )
    );
    return enriched.filter(Boolean);
  }

  assertBackendUserSupported();

  try {
    const { data } = await apiClient.get(API_ENDPOINTS.USER_SAVED_PRODUCTS, {
      params: {
        destination_country: destinationCountry,
        preferred_currency: preferredCurrency,
      },
    });
    const raw = Array.isArray(data?.products)
      ? data.products
      : Array.isArray(data)
      ? data
      : [];
    return raw.map((p) => normalizeProduct(p, 'live')).filter(Boolean);
  } catch (err) {
    throw normalizeApiError(err, 'Unable to load saved products.');
  }
}

export async function saveProductToAccount(product) {
  const productId = typeof product === 'string' ? product : product?.id;
  if (!productId) {
    throw new ApiServiceError('Product ID is required.', { status: 400 });
  }

  if (isMockApiEnabled()) {
    await simulateMockLatency(160);
    await mockSaveProduct(productId);
    return { saved: true, productId };
  }

  assertBackendUserSupported();

  try {
    await apiClient.post(API_ENDPOINTS.USER_SAVED_PRODUCTS, {
      product_id: productId,
    });
    return { saved: true, productId };
  } catch (err) {
    throw normalizeApiError(err, 'Unable to save product.');
  }
}

export async function removeSavedProductFromAccount(productId) {
  if (isMockApiEnabled()) {
    await simulateMockLatency(140);
    await mockRemoveSavedProduct(productId);
    return { removed: true, productId };
  }

  assertBackendUserSupported();

  try {
    await apiClient.delete(API_ENDPOINTS.USER_SAVED_PRODUCT_DETAIL(productId));
    return { removed: true, productId };
  } catch (err) {
    throw normalizeApiError(err, 'Unable to remove saved product.');
  }
}

export async function getUserOrders() {
  if (isMockApiEnabled()) {
    await simulateMockLatency(200);
    const list = await mockGetUserOrders();
    return list.map((o) => normalizeOrder(o, 'mock')).filter(Boolean);
  }

  assertBackendUserSupported();

  try {
    const { data } = await apiClient.get(API_ENDPOINTS.USER_ORDERS);
    const raw = Array.isArray(data?.orders) ? data.orders : Array.isArray(data) ? data : [];
    return raw.map((o) => normalizeOrder(o, 'live')).filter(Boolean);
  } catch (err) {
    throw normalizeApiError(err, 'Unable to load order history.');
  }
}

export async function saveDeliveryAddress(address) {
  if (isMockApiEnabled()) {
    return mockSaveAddress(address);
  }
  return [address];
}

export async function recordUserSearchHistory(entry) {
  if (isMockApiEnabled()) {
    return mockRecordSearch(entry);
  }
  return [];
}

