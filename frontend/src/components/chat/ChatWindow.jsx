import { useEffect, useRef } from 'react';
import { History, RefreshCw, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SuggestedPrompts } from './SuggestedPrompts';
import { TypingIndicator } from './TypingIndicator';
import { Button } from '@/components/common/Button';
import { ProductImage } from '@/components/common/ProductImage';
import { ZenLogo } from '@/components/common/ZenLogo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { getCountryName } from '@/utils/currencyFormatter';

const DISCOVERY_CATEGORIES = [
  {
    id: 'electronics',
    title: 'Electronics',
    subtitle: 'Audio, laptops & cameras',
    image: '/images/products/sony-xm5.jpg',
    prompt: 'Find Sony WH-1000XM5 headphones from USA under ₹25,000',
  },
  {
    id: 'fashion',
    title: 'Fashion',
    subtitle: 'British & heritage outerwear',
    image: '/images/products/fashion-outerwear.jpg',
    prompt: 'Find waxed cotton jacket from UK with estimated delivered cost',
  },
  {
    id: 'home-kitchen',
    title: 'Home & Kitchen',
    subtitle: 'Espresso & appliances',
    image: '/images/products/espresso-machine.jpg',
    prompt: 'Find compact espresso machines from Germany',
  },
  {
    id: 'beauty-personal-care',
    title: 'Beauty & Care',
    subtitle: 'Seoul & Singapore serums',
    image: '/images/products/skincare-serum.jpg',
    prompt: 'Compare skincare serums from South Korea and Singapore',
  },
  {
    id: 'travel-accessories',
    title: 'Travel & Sports',
    subtitle: 'Packs & running footwear',
    image: '/images/products/travel-backpack.jpg',
    prompt: 'Find carry-on travel backpack or running shoes with low shipping cost',
  },
];

export function ChatWindow({
  messages = [],
  isTyping = false,
  error = null,
  canRetry = false,
  onSendMessage,
  onRetry,
  onClear,
  comparisonCount = 0,
  onOpenCompare,
  destinationCountry = 'IN',
  preferredCurrency = 'INR',
}) {
  const bottomRef = useRef(null);
  const { user, isAuthenticated } = useAuth();
  const { residenceCountry } = useCurrency();
  const firstName = user?.fullName ? user.fullName.trim().split(' ')[0] : null;
  const searchHistory = Array.isArray(user?.searchHistory) ? user.searchHistory.slice(0, 4) : [];
  const isEmptyState = messages.length === 0 && !isTyping;

  useEffect(() => {
    if (!isEmptyState) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length, isTyping, isEmptyState]);

  const lastAssistantWithPrompts = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant' && m.followUpPrompts?.length > 0);

  if (isEmptyState) {
    return (
      <div className="mx-auto flex w-full max-w-[920px] flex-1 flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        <div className="border-b border-[#E6E5E0] pb-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <ZenLogo size="xs" alt="Zen Global" />
              <span aria-hidden="true" className="h-3.5 w-px bg-[#D8D6CF]" />
              <p className="zen-eyebrow text-[#465BE6]">
                Shopping Assistant
              </p>
            </div>
            <p className="text-[12px] text-[#747987] tabular-nums">
              {isAuthenticated ? (
                <>
                  Residence {residenceCountry} · Delivering to{' '}
                  <strong className="font-[580] text-[#151923]">
                    {getCountryName(destinationCountry)} ({destinationCountry})
                  </strong>{' '}
                  · <strong className="font-[580] text-[#151923]">{preferredCurrency}</strong>
                </>
              ) : (
                <>Showing seller&apos;s local currency · Sign in for currency conversion &amp; delivery</>
              )}
            </p>
          </div>

          <h1 className="zen-page-title mt-3 text-[32px] sm:text-[44px] text-[#151923]">
            {firstName ? `Hi ${firstName}, what are you looking for?` : 'What are you looking for?'}
          </h1>

          <p className="mt-2.5 max-w-xl text-[15px] leading-[1.6] text-[#747987]">
            Tell me what you want to buy, where you&apos;d like it shipped from, and where it needs to go.
            You can also set a country or currency in your message (for example, &ldquo;deliver to UK in EUR&rdquo;).
          </p>
        </div>

        {/* Refined Shopping Brief Input Area */}
        <div className="mt-7">
          <ChatInput
            variant="empty"
            onSend={onSendMessage}
            disabled={isTyping}
            placeholder="e.g., Running shoes from Japan under ₹15,000, espresso maker from Germany, or skincare from Korea..."
          />
        </div>

        {/* Curated Shopping Briefs */}
        <div className="mt-7 space-y-4">
          <SuggestedPrompts
            variant="empty"
            onSelect={onSendMessage}
            disabled={isTyping}
            destinationCountry={destinationCountry}
          />

          {isAuthenticated && searchHistory.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 text-[11.5px] font-[550] text-[#747987]">
                <History className="h-3.5 w-3.5 text-[#465BE6]" />
                Recent:
              </span>
              {searchHistory.map((item) => (
                <button
                  key={item.id || item.query}
                  type="button"
                  onClick={() => onSendMessage(item.query)}
                  className="rounded-full border border-[#E6E5E0] bg-white px-3 py-1 text-[12px] font-medium text-[#151923] transition-colors hover:border-[#465BE6] hover:text-[#465BE6]"
                >
                  {item.query}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Photographic Category Suggestions (5 Required Categories) */}
        <div className="mt-12 border-t border-[#E6E5E0] pt-8">
          <div className="mb-4 flex items-center justify-between">
            <span className="zen-eyebrow text-[#747987]">
              Browse by department
            </span>
            <Link
              to="/results"
              className="text-[12.5px] font-[550] text-[#465BE6] hover:text-[#3549CC] transition-colors"
            >
              Open full catalog →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {DISCOVERY_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onSendMessage(category.prompt)}
                className="group flex flex-col text-left focus:outline-none"
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-md border border-[#E6E5E0] bg-[#F1EFE9]">
                  <ProductImage
                    src={category.image}
                    alt={category.title}
                    className="h-full w-full"
                    imgClassName="group-hover:scale-[1.04]"
                  />
                </div>
                <p className="mt-2.5 text-[13.5px] font-[590] text-[#151923] group-hover:text-[#465BE6] transition-colors">
                  {category.title}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-[#747987]">
                  {category.subtitle}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-1 flex-col px-4 sm:px-6">
      {/* Quiet Active Inquiry Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E5E0] py-3.5">
        <div className="flex items-center gap-2 text-[12.5px] text-[#747987] tabular-nums">
          <span className="font-[580] text-[#151923]">Shopping Brief</span>
          <span className="text-[#D0CEC6]">·</span>
          <span>
            {getCountryName(destinationCountry)} ({destinationCountry}) · {preferredCurrency}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {comparisonCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCompare}
            >
              Compare ({comparisonCount})
            </Button>
          ) : null}

          <Link
            to="/results"
            className="hidden sm:inline-flex h-8 items-center rounded-md px-2.5 text-[12.5px] font-medium text-[#747987] hover:bg-[#EFECE6]/70 hover:text-[#151923] transition-colors"
          >
            Discover
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-[#747987] hover:text-[#151923]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New chat
          </Button>
        </div>
      </div>

      {/* Structured Conversation Stream */}
      <div className="flex-1 space-y-6 py-7">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isTyping ? <TypingIndicator /> : null}

        {error ? (
          <Alert variant="destructive">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <AlertTitle>Assistant response unavailable</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </div>
              {canRetry ? (
                <Button size="sm" variant="outline" onClick={onRetry}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </Button>
              ) : null}
            </div>
          </Alert>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {/* Persistent Docked Composer */}
      <div className="sticky bottom-0 z-20 border-t border-[#E6E5E0] bg-[#F8F7F4]/95 py-4 backdrop-blur-md">
        {!isTyping && lastAssistantWithPrompts?.followUpPrompts?.length > 0 ? (
          <div className="mb-3">
            <SuggestedPrompts
              variant="follow-up"
              prompts={lastAssistantWithPrompts.followUpPrompts}
              onSelect={onSendMessage}
              disabled={isTyping}
            />
          </div>
        ) : null}

        <ChatInput
          variant="dock"
          onSend={onSendMessage}
          disabled={isTyping}
          placeholder="Ask to change origin country, adjust your budget, or compare delivery speeds..."
        />
      </div>
    </div>
  );
}
