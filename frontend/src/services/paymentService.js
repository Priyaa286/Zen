import {
  apiClient,
  API_ENDPOINTS,
  isMockApiEnabled,
  normalizeApiError,
  simulateMockLatency,
} from './api';
import { normalizeCheckoutSummary, normalizeOrder } from './adapters';
import {
  MOCK_PRODUCTS,
  calculateMockCheckout,
  saveMockOrder,
} from '@/mocks';

/**
 * Calculate authoritative landed cost breakdown from backend.
 * Endpoint: POST /api/checkout/calculate
 */
export async function calculateCheckout({
  productId,
  quantity = 1,
  destinationCountry = 'IN',
  targetCurrency = 'INR',
  shippingOptionId = null,
  shippingAddress = null,
}) {
  if (isMockApiEnabled()) {
    await simulateMockLatency(340);
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      throw normalizeApiError(new Error('Selected product was not found for checkout calculation.'));
    }
    const calc = calculateMockCheckout({
      product,
      quantity,
      destinationCountry,
      targetCurrency,
      shippingOptionId: shippingOptionId || undefined,
    });
    return normalizeCheckoutSummary(calc, 'mock');
  }

  try {
    const { data } = await apiClient.post(API_ENDPOINTS.CHECKOUT_CALCULATE, {
      product_id: productId,
      quantity,
      destination_country: destinationCountry,
      target_currency: targetCurrency,
      shipping_option_id: shippingOptionId,
      shipping_address: shippingAddress,
    });
    return normalizeCheckoutSummary(data, 'live');
  } catch (err) {
    throw normalizeApiError(err, "We couldn't calculate the order total right now.");
  }
}

/**
 * Create a PayPal-backed order via FastAPI backend.
 * Frontend NEVER creates authoritative PayPal amounts client-side.
 * Endpoint: POST /api/checkout/create
 */
export async function createCheckoutOrder({
  checkoutSessionId,
  productId,
  quantity,
  destinationCountry,
  targetCurrency,
  shippingOptionId,
  shippingAddress,
  userApprovedAmount,
}) {
  if (!userApprovedAmount) {
    throw normalizeApiError(
      new Error('Explicit purchase approval is required before initiating payment.')
    );
  }

  if (isMockApiEnabled()) {
    await simulateMockLatency(360);
    return {
      orderId: `ZEN-MOCK-${Date.now().toString().slice(-6)}`,
      paypalOrderId: `PAYPAL-MOCK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      checkoutSessionId,
      status: 'CREATED',
      isMock: true,
      source: 'mock',
    };
  }

  try {
    const { data } = await apiClient.post(API_ENDPOINTS.CHECKOUT_CREATE, {
      checkout_session_id: checkoutSessionId,
      product_id: productId,
      quantity,
      destination_country: destinationCountry,
      target_currency: targetCurrency,
      shipping_option_id: shippingOptionId,
      shipping_address: shippingAddress,
      user_approved: true,
    });

    const paypalOrderId = data?.paypalOrderId ?? data?.paypal_order_id ?? data?.id;
    if (!paypalOrderId) {
      throw new Error('Backend did not return a valid PayPal order ID.');
    }

    return {
      orderId: data?.orderId ?? data?.order_id ?? paypalOrderId,
      paypalOrderId,
      checkoutSessionId: data?.checkoutSessionId ?? data?.checkout_session_id ?? checkoutSessionId,
      status: data?.status ?? 'CREATED',
      isMock: false,
      source: 'live',
    };
  } catch (err) {
    throw normalizeApiError(err, 'Could not create PayPal checkout order.');
  }
}

/**
 * Capture and verify PayPal payment on the FastAPI backend.
 * Frontend treats ONLY this verified backend response as proof of payment.
 * Endpoint: POST /api/checkout/capture
 */
export async function captureCheckoutOrder({
  paypalOrderId,
  orderId,
  checkoutSummary,
  product,
  shippingAddress,
  userId = null,
  simulatedOutcome = 'COMPLETED',
}) {
  if (isMockApiEnabled()) {
    await simulateMockLatency(480);

    if (simulatedOutcome === 'FAILED') {
      throw normalizeApiError(
        new Error('Mock Sandbox Simulation: PayPal capture was declined by issuing bank.')
      );
    }

    const status = simulatedOutcome === 'PENDING' ? 'PENDING' : 'COMPLETED';
    const orderRecord = saveMockOrder({
      orderId: orderId || `ZEN-MOCK-${Date.now().toString().slice(-6)}`,
      paypalOrderId: paypalOrderId || `PAYPAL-MOCK-${Date.now().toString().slice(-6)}`,
      paypalTransactionId:
        status === 'COMPLETED'
          ? `TXN-SANDBOX-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
          : null,
      status,
      statusReason:
        status === 'PENDING'
          ? 'Mock Sandbox Simulation: Payment is pending bank verification.'
          : 'Mock Preview Only — Simulated PayPal Sandbox confirmation (backend offline).',
      product,
      productTitle: product?.title || checkoutSummary?.productTitle,
      merchantName: product?.merchant?.name || checkoutSummary?.merchantName,
      quantity: checkoutSummary?.quantity || 1,
      totalAmount: checkoutSummary?.breakdown?.totalPayable ?? null,
      currency: checkoutSummary?.targetCurrency || 'INR',
      settlementAmount: checkoutSummary?.breakdown?.paypalSettlementAmount ?? null,
      settlementCurrency: checkoutSummary?.breakdown?.paypalSettlementCurrency || 'USD',
      deliveryEstimate: checkoutSummary?.shippingOption?.etaLabel || '5–8 business days',
      shippingAddress,
      breakdown: checkoutSummary?.breakdown || null,
      userId: userId || null,
      createdAt: new Date().toISOString(),
      isMock: true,
    });

    return normalizeOrder(orderRecord, 'mock');
  }

  try {
    const { data } = await apiClient.post(API_ENDPOINTS.CHECKOUT_CAPTURE, {
      paypal_order_id: paypalOrderId,
      order_id: orderId,
    });
    const normalized = normalizeOrder(data, 'live');
    if (!normalized || normalized.status === 'UNKNOWN') {
      throw new Error('Backend capture response did not confirm a valid payment status.');
    }
    return normalized;
  } catch (err) {
    throw normalizeApiError(
      err,
      'Payment capture verification failed. Please check your order status before retrying.'
    );
  }
}
