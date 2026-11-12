import { ArrowRight, BadgeCheck, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getCountryName } from '@/utils/currencyFormatter';
import { cn } from '@/utils/cn';

export function normalizeVariantGroups(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return [];
  // Grouped format: [{ name: 'Size', options: ['M', 'L'] }]
  if (variants[0] && Array.isArray(variants[0].options)) {
    return variants.filter((g) => g?.name && Array.isArray(g.options) && g.options.length > 0);
  }
  // Flat format: [{ id: 'size-m', label: 'Size M' }]
  const labels = variants
    .map((v) => (typeof v === 'string' ? v : v?.label || v?.name || v?.id))
    .filter(Boolean);
  return labels.length > 0 ? [{ name: 'Option', options: labels }] : [];
}

export function ProductPricing({
  product,
  destinationCountry,
  selectedVariant,
  onSelectVariantOption,
  isAuthenticated = true,
}) {
  const isOutOfStock = product.availability === 'out_of_stock';
  const isVerified = Boolean(product.merchant?.verified);
  const variantGroups = normalizeVariantGroups(product.variants);

  return (
    <div className="space-y-4">
      {/* Status & Category Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {product.category ? <Badge variant="secondary">{product.category}</Badge> : null}
        {product.subcategory ? (
          <Badge variant="outline" className="text-[#697586]">
            {product.subcategory}
          </Badge>
        ) : null}
        {product.availability === 'in_stock' ? (
          <Badge variant="success">{product.stockLabel || 'In stock'}</Badge>
        ) : null}
        {product.availability === 'limited_stock' ? (
          <Badge variant="warning">{product.stockLabel || 'Limited stock'}</Badge>
        ) : null}
        {isOutOfStock ? (
          <Badge variant="destructive">{product.stockLabel || 'Out of stock'}</Badge>
        ) : null}
        {isVerified && product.rating !== null ? (
          <Badge variant="outline" className="gap-1 tabular-nums text-[#17202F]">
            <Star className="h-3 w-3 fill-[#D69A29] text-[#D69A29]" />
            {product.rating.toFixed(1)}
            {product.reviewCount ? ` (${product.reviewCount.toLocaleString()} reviews)` : ''}
          </Badge>
        ) : null}
      </div>

      <h1 className="text-2xl sm:text-3xl font-[680] tracking-[-0.025em] text-[#17202F]">
        {product.title}
      </h1>

      {/* Merchant & Cross-Border Route */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#E5E7EB] py-3.5 text-xs">
        <div className="flex items-center gap-2.5">
          {product.merchant?.country ? (
            <span className="inline-flex h-7 items-center rounded border border-[#E5E7EB] bg-[#F1F3F6] px-2 text-[11px] font-semibold tracking-wider text-[#172554]">
              {product.merchant.country}
            </span>
          ) : null}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[#17202F]">{product.merchant?.name}</span>
              {isVerified ? (
                <BadgeCheck className="h-3.5 w-3.5 text-[#465BE6]" aria-label="Verified merchant" />
              ) : null}
            </div>
            <p className="text-[#697586]">
              {isAuthenticated ? 'Ships from ' : 'Sold in '}
              {product.merchant?.dispatchLocation || getCountryName(product.merchant?.country)}
            </p>
          </div>
        </div>

        {isAuthenticated ? (
          <div className="inline-flex items-center gap-1.5 rounded border border-[#E5E7EB] bg-[#F7F8FA] px-2.5 py-1 font-medium text-[#17202F] tabular-nums">
            <span>{product.merchant?.country}</span>
            <ArrowRight className="h-3 w-3 text-[#465BE6]" />
            <span>{destinationCountry}</span>
          </div>
        ) : (
          <span className="inline-flex items-center rounded border border-[#E5E7EB] bg-[#F7F8FA] px-2.5 py-1 text-[11px] font-medium text-[#697586]">
            Seller currency: {product.originalCurrency || 'USD'}
          </span>
        )}
      </div>

      {/* Optional Variant Selectors (rendered strictly when product.variants exists) */}
      {variantGroups.length > 0 ? (
        <div className="space-y-3 rounded-lg border border-[#E5E7EB] bg-[#F7F8FA]/80 p-3.5">
          {variantGroups.map((group) => (
            <div key={group.name} className="space-y-1.5">
              <p className="text-[11.5px] font-[600] uppercase tracking-[0.05em] text-[#697586]">
                {group.name}:{' '}
                <span className="text-[#17202F]">
                  {selectedVariant?.[group.name] || group.options[0]}
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map((option) => {
                  const active =
                    (selectedVariant?.[group.name] || group.options[0]) === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onSelectVariantOption?.(group.name, option)}
                      className={cn(
                        'rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors',
                        active
                          ? 'border-[#172554] bg-[#172554] text-white'
                          : 'border-[#E5E7EB] bg-white text-[#17202F] hover:border-[#465BE5]'
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
