import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  GitCompareArrows,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ProductImage } from '@/components/common/ProductImage';
import { useAppContext } from '@/context/AppContext';
import { useCartContext } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, getCountryName } from '@/utils/currencyFormatter';
import { formatPrice } from '@/utils/formatPrice';
import { cn } from '@/utils/cn';

function renderFormattedLine(line, lineKey) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span key={lineKey}>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={idx} className="font-[600] text-[#151923]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}

function RichMessageContent({ content }) {
  const blocks = String(content || '').split(/\n\n+/);

  return (
    <div className="space-y-3 text-[14.5px] leading-[1.65] text-[#151923]/90">
      {blocks.map((block, bIdx) => {
        const lines = block.split('\n').filter(Boolean);
        const isList = lines.length > 0 && lines.every((l) => l.trim().startsWith('•'));

        if (isList) {
          return (
            <ul key={bIdx} className="space-y-2 border-l border-[#E6E5E0] pl-4">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="leading-[1.6]">
                  {renderFormattedLine(line.replace(/^\s*•\s*/, ''), lIdx)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={bIdx}>
            {lines.map((line, lIdx) => (
              <span key={lIdx}>
                {renderFormattedLine(line, lIdx)}
                {lIdx < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function EmbeddedProductCard({ product, isBestMatch }) {
  const navigate = useNavigate();
  const { preferredCurrency } = useAppContext();
  const { isAuthenticated } = useAuth();
  const { selectProductForCheckout, toggleCompareProduct, comparisonItems } =
    useCartContext();
  const { showToast } = useToast();

  const isCompared = comparisonItems.some((item) => item.id === product.id);
  const currency = product.targetCurrency || preferredCurrency;

  const originalDisplay =
    product.originalPrice != null
      ? formatPrice(product.originalPrice, product.originalCurrency || 'USD')
      : 'Unavailable';

  const convertedDisplay =
    product.convertedPrice != null
      ? formatCurrency(product.convertedPrice, currency, { compact: true })
      : '—';

  const shippingDisplay =
    product.shippingCost != null
      ? formatCurrency(product.shippingCost, currency, { compact: true })
      : product.unavailableReason || 'Unavailable';

  const totalDisplay =
    product.totalLandedCost != null
      ? formatCurrency(product.totalLandedCost, currency, { compact: true })
      : 'Unavailable';

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      showToast({
        title: 'Sign in required',
        description: 'Please sign in to buy items or view checkout totals.',
        tone: 'info',
      });
      navigate('/login');
      return;
    }
    selectProductForCheckout(product, 1);
    navigate('/checkout');
  };

  const handleViewDetails = () => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  const handleToggleCompare = () => {
    const res = toggleCompareProduct(product);
    if (res.limitReached) {
      showToast({
        title: 'Compare limit reached',
        description: 'Remove one item before adding another to side-by-side comparison.',
        tone: 'warning',
      });
      return;
    }
    showToast({
      title: res.added ? 'Added to comparison' : 'Removed from comparison',
      description: product.shortTitle || product.title,
      tone: 'info',
    });
  };

  const isBlocked =
    product.availability === 'out_of_stock' || product.shippingAvailable === false;

  return (
    <article
      className={cn(
        'flex flex-col justify-between rounded-md border bg-white p-4 transition-colors hover:border-[#D0CEC6]',
        isBestMatch && product.shippingAvailable
          ? 'border-[#168B66]/45'
          : 'border-[#E6E5E0]'
      )}
    >
      <div>
        <div className="flex items-start gap-3.5">
          <button
            type="button"
            onClick={handleViewDetails}
            className="h-20 w-24 shrink-0 overflow-hidden rounded border border-[#E6E5E0] bg-[#F1EFE9]"
            aria-label={`View ${product.title}`}
          >
            <ProductImage
              src={product.imageUrl}
              alt={product.title}
              className="h-full w-full"
              fit="cover"
            />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#747987] truncate">
                {product.merchant?.country ? (
                  <span className="shrink-0 rounded border border-[#E6E5E0] bg-[#F8F7F4] px-1 py-0.5 text-[10px] font-semibold text-[#151923]">
                    {product.merchant.country}
                  </span>
                ) : null}
                <span className="truncate">{product.merchant?.name}</span>
                {product.merchant?.verified ? (
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#465BE6]" />
                ) : null}
              </div>

              {isAuthenticated && isBestMatch && product.shippingAvailable ? (
                <span className="shrink-0 rounded border border-[#168B66]/30 bg-[#168B66]/[0.08] px-2 py-0.5 text-[10.5px] font-[560] text-[#168B66]">
                  Lowest est. total
                </span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleViewDetails}
              className="mt-1 text-left font-[590] text-[14.5px] leading-snug text-[#151923] hover:text-[#465BE6] transition-colors line-clamp-2"
            >
              {product.shortTitle || product.title}
            </button>

            <p className="mt-1 text-[11.5px] text-[#747987]">
              {isAuthenticated
                ? `Arrives in ${product.deliveryEstimate || '5–8 business days'}`
                : `Sold in ${getCountryName(product.merchant?.country)}`}
            </p>
          </div>
        </div>

        {/* Hairline Cost Breakdown (No Nested Gray Box) */}
        <div className="mt-3.5 border-t border-[#E6E5E0] pt-3 tabular-nums">
          {isAuthenticated ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-[11.5px]">
                <div>
                  <p className="text-[#747987]">Seller price</p>
                  <p className="mt-0.5 font-[550] text-[#151923]">{originalDisplay}</p>
                </div>
                <div>
                  <p className="text-[#747987]">Converted</p>
                  <p className="mt-0.5 font-[550] text-[#151923]">{convertedDisplay}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#747987]">Shipping</p>
                  <p className="mt-0.5 font-[550] text-[#747987] truncate">{shippingDisplay}</p>
                </div>
              </div>

              <div className="mt-2.5 flex items-baseline justify-between border-t border-[#E6E5E0] pt-2.5">
                <span className="text-[11.5px] font-[550] text-[#747987]">
                  Estimated delivered cost
                </span>
                <span className="text-[17px] font-[640] tracking-[-0.02em] text-[#151923]">
                  {totalDisplay}
                </span>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[11.5px] text-[#747987]">
                  Seller price ({product.originalCurrency || 'USD'})
                </span>
                <span className="text-[16px] font-[640] text-[#151923]">{originalDisplay}</span>
              </div>
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded border border-[#E6E5E0] bg-[#F8F7F4] px-2.5 py-1.5 text-[11px] font-medium text-[#465BE6] hover:bg-[#465BE6]/[0.05]"
              >
                <Lock className="h-3 w-3 shrink-0" />
                <span>Sign in for currency conversion &amp; delivery details</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewDetails}
          className="flex-1 min-w-[92px]"
        >
          View details
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleCompare}
          className={cn(
            'shrink-0',
            isCompared
              ? 'border-[#168B66]/45 bg-[#168B66]/[0.07] text-[#168B66] hover:bg-[#168B66]/10'
              : 'text-[#747987] hover:text-[#151923]'
          )}
        >
          {isCompared ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Compared
            </>
          ) : (
            <>
              <GitCompareArrows className="h-3.5 w-3.5" />
              Compare
            </>
          )}
        </Button>

        <Button
          size="sm"
          disabled={isBlocked}
          onClick={handleBuyNow}
          className="flex-1 min-w-[96px]"
        >
          {isBlocked ? 'Unavailable' : 'Buy now'}
          {!isBlocked ? <ArrowRight className="h-3.5 w-3.5" /> : null}
        </Button>
      </div>
    </article>
  );
}

export function ChatMessage({ message }) {
  const { isAuthenticated } = useAuth();
  const isUser = message.role === 'user';
  const products = message.products || [];

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="flex justify-end py-1"
      >
        <div className="max-w-[85%] sm:max-w-[72%] rounded-md bg-[#151923] px-4 py-3 text-[14.5px] leading-relaxed text-white">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5 py-1"
    >
      <div className="rounded-md border border-[#E6E5E0] border-l-2 border-l-[#465BE6] bg-white p-5 sm:p-6">
        {isAuthenticated && message.intent?.detectedDestination ? (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E5E0] pb-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[#747987] tabular-nums">
            <span>Delivery &amp; cost estimate</span>
            <span>
              {message.intent.detectedOrigin ? `${message.intent.detectedOrigin} → ` : ''}
              {message.intent.detectedDestination}
              {message.intent.currency ? ` · ${message.intent.currency}` : ''}
            </span>
          </div>
        ) : null}

        <RichMessageContent content={message.content} />
      </div>

      {products.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <span className="zen-eyebrow text-[#747987]">
              Available offers ({products.length})
            </span>
            <span className="text-[11.5px] text-[#747987]">
              {isAuthenticated
                ? 'Sorted by estimated delivered cost'
                : "Shown in each seller's currency · Sign in for delivery & conversion"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {products.map((product, idx) => (
              <EmbeddedProductCard
                key={product.id}
                product={product}
                isBestMatch={idx === 0}
              />
            ))}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
