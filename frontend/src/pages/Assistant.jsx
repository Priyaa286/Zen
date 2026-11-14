import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ProductComparison } from '@/components/products/ProductComparison';
import { SEOHead } from '@/components/common/SEOHead';
import { useCartContext } from '@/context/CartContext';
import { useChat } from '@/hooks/useChat';

export function Assistant() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [compareOpen, setCompareOpen] = useState(false);
  const { comparisonItems } = useCartContext();
  const lastDispatchedPromptRef = useRef(null);

  const {
    messages,
    isTyping,
    error,
    canRetry,
    sendMessage,
    retryLastMessage,
    clearConversation,
    destinationCountry,
    preferredCurrency,
  } = useChat();

  useEffect(() => {
    const queryPrompt = searchParams.get('prompt') || searchParams.get('q');
    if (queryPrompt && queryPrompt.trim()) {
      const normalized = queryPrompt.trim();
      if (lastDispatchedPromptRef.current === normalized) {
        return;
      }
      lastDispatchedPromptRef.current = normalized;
      sendMessage(normalized);
      const next = new URLSearchParams(searchParams);
      next.delete('prompt');
      next.delete('q');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, sendMessage, setSearchParams]);

  return (
    <div className="flex min-h-[calc(100vh-76px)] flex-col bg-[#F8F7F4]">
      <SEOHead
        title="AI Shopping Assistant – International Recommendations & Price Comparison"
        description="Ask Zen AI to find products worldwide, convert currencies, estimate shipping and customs duties, and recommend the best deals from verified international sellers."
        canonical="/assistant"
        keywords="ai shopping assistant, borderless shopping chat, find products abroad, international landed cost calculation"
      />
      <ChatWindow
        messages={messages}
        isTyping={isTyping}
        error={error}
        canRetry={canRetry}
        onSendMessage={sendMessage}
        onRetry={retryLastMessage}
        onClear={clearConversation}
        comparisonCount={comparisonItems.length}
        onOpenCompare={() => setCompareOpen(true)}
        destinationCountry={destinationCountry}
        preferredCurrency={preferredCurrency}
      />

      <ProductComparison
        open={compareOpen}
        onOpenChange={setCompareOpen}
        hideStickyBar
      />
    </div>
  );
}

export default Assistant;
