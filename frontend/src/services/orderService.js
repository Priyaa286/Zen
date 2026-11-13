import {
  apiClient,
  API_ENDPOINTS,
  isMockApiEnabled,
  normalizeApiError,
  simulateMockLatency,
} from './api';
import { normalizeOrder } from './adapters';
import { getMockOrderById } from '@/mocks';

/**
 * Retrieve verified order details by ID.
 * Endpoint: GET /api/orders/{id}
 */
export async function getOrderById(orderId) {
  if (!orderId) {
    throw normalizeApiError(new Error('Order ID is required.'));
  }

  if (isMockApiEnabled()) {
    await simulateMockLatency(220);
    const found = getMockOrderById(orderId);
    if (!found) {
      throw normalizeApiError(new Error(`No mock preview order found with ID ${orderId}.`));
    }
    return normalizeOrder(found, 'mock');
  }

  try {
    const { data } = await apiClient.get(API_ENDPOINTS.ORDER_DETAIL(orderId));
    return normalizeOrder(data?.order ?? data, 'live');
  } catch (err) {
    throw normalizeApiError(err, 'Unable to load order details.');
  }
}
