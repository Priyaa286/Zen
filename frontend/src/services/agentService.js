import {
  apiClient,
  API_ENDPOINTS,
  isMockApiEnabled,
  normalizeApiError,
  simulateMockLatency,
} from './api';
import { normalizeProduct } from './adapters';
import { generateMockAgentReply } from '@/mocks';

/**
 * Send a conversational shopping request to the Zen AI backend agent.
 * Endpoint: POST /api/agent/chat
 */
export async function sendChatMessage({
  message,
  conversationId = null,
  preferences = {},
}) {
  if (isMockApiEnabled()) {
    await simulateMockLatency(520);
    const mockRes = generateMockAgentReply({
      message,
      conversationId,
      preferences,
    });
    return {
      conversationId: mockRes.conversationId,
      reply: mockRes.reply,
      products: (mockRes.products || []).map((p) => normalizeProduct(p, 'mock')),
      intent: mockRes.intent || null,
      followUpPrompts: mockRes.followUpPrompts || [],
      source: 'mock',
    };
  }

  try {
    const payload = {
      message,
      conversation_id: conversationId,
      residence_country: preferences.residenceCountry || preferences.destinationCountry || 'IN',
      destination_country: preferences.destinationCountry || 'IN',
      preferred_currency: preferences.preferredCurrency || 'INR',
      ...(preferences.userId ? { user_id: preferences.userId } : {}),
    };
    const { data } = await apiClient.post(API_ENDPOINTS.AGENT_CHAT, payload, {
      timeout: 45000,
    });

    const rawProducts = Array.isArray(data?.products)
      ? data.products
      : Array.isArray(data?.results)
      ? data.results
      : [];

    const rawIntent = data?.intent ?? null;
    const normalizedIntent = rawIntent
      ? {
          detectedBudget: rawIntent.detectedBudget ?? rawIntent.detected_budget ?? null,
          detectedOrigin: rawIntent.detectedOrigin ?? rawIntent.detected_origin ?? null,
          detectedDestination:
            rawIntent.detectedDestination ?? rawIntent.detected_destination ?? null,
          currency: rawIntent.currency ?? preferences.preferredCurrency ?? null,
        }
      : null;

    return {
      conversationId: data?.conversationId ?? data?.conversation_id ?? conversationId,
      reply: data?.reply ?? data?.message ?? data?.response ?? 'Response received.',
      products: rawProducts.map((p) => normalizeProduct(p, 'live')).filter(Boolean),
      intent: normalizedIntent,
      followUpPrompts: Array.isArray(data?.followUpPrompts ?? data?.follow_up_prompts)
        ? data.followUpPrompts ?? data.follow_up_prompts
        : [],
      source: 'live',
    };
  } catch (err) {
    throw normalizeApiError(err, 'Unable to reach the Zen AI shopping assistant.');
  }
}
