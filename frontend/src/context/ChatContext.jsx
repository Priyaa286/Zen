import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { sendChatMessage } from '@/services/agentService';
import { useAppContext } from './AppContext';
import { useAuthContext } from './AuthContext';

const ChatContext = createContext(null);

const WELCOME_MESSAGE = {
  id: 'zen-welcome',
  role: 'assistant',
  content:
    "Hi! I'm **Zen**, your shopping assistant. Tell me what you want to buy, which country you'd like it shipped from or to, and your target budget — I'll compare seller offers, convert currencies, estimate shipping and duties, and show your estimated delivered cost.",
  products: [],
  followUpPrompts: [
    'I want to buy Sony WH-1000XM5 headphones from the USA and deliver them to India. My budget is ₹25,000.',
    'Find Keychron Q1 Pro mechanical keyboards shipping to India',
    'Compare Nintendo Switch OLED from Japan with delivery estimate',
  ],
  timestamp: new Date().toISOString(),
};

export function ChatProvider({ children }) {
  const { residenceCountry, destinationCountry, preferredCurrency } = useAppContext();
  const { user, recordSearch } = useAuthContext();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [failedText, setFailedText] = useState(null);
  const inFlightRef = useRef(false);

  const dispatchToAgent = useCallback(
    async (text) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setError(null);
      setIsTyping(true);

      try {
        const res = await sendChatMessage({
          message: text,
          conversationId,
          preferences: {
            residenceCountry,
            destinationCountry,
            preferredCurrency,
            userId: user?.id || null,
            isAuthenticated: Boolean(user),
          },
        });

        if (res.conversationId) {
          setConversationId(res.conversationId);
        }

        const assistantMsg = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          products: res.products || [],
          followUpPrompts: res.followUpPrompts || [],
          intent: res.intent || null,
          source: res.source,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setFailedText(null);
        if (user?.id) {
          recordSearch({
            query: text,
            destinationCountry: res.intent?.detectedDestination || destinationCountry,
            preferredCurrency: res.intent?.currency || preferredCurrency,
          }).catch(() => {});
        }
      } catch (err) {
        setFailedText(text);
        setError(err?.message || "I couldn't reach the Shopping Assistant right now. Please try again.");
      } finally {
        inFlightRef.current = false;
        setIsTyping(false);
      }
    },
    [conversationId, residenceCountry, destinationCountry, preferredCurrency, user?.id, recordSearch]
  );

  const sendMessage = useCallback(
    async (rawText) => {
      const text = typeof rawText === 'string' ? rawText.trim() : '';
      if (!text || inFlightRef.current) return;

      const userMsg = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      await dispatchToAgent(text);
    },
    [dispatchToAgent]
  );

  const retryLastMessage = useCallback(() => {
    if (failedText && !inFlightRef.current) {
      dispatchToAgent(failedText);
    }
  }, [failedText, dispatchToAgent]);

  const clearConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setError(null);
    setFailedText(null);
  }, []);

  const value = useMemo(
    () => ({
      conversationId,
      messages,
      isTyping,
      error,
      sendMessage,
      retryLastMessage,
      clearConversation,
      canRetry: Boolean(failedText),
    }),
    [conversationId, messages, isTyping, error, sendMessage, retryLastMessage, clearConversation, failedText]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChatContext must be used inside ChatProvider');
  }
  return ctx;
}
