import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAllCategories } from '@/data/categories';

const ORIGIN_MARKETS = [
  { code: 'ALL', label: 'All origins' },
  { code: 'US', label: 'US · United States' },
  { code: 'JP', label: 'JP · Japan' },
  { code: 'SG', label: 'SG · Singapore' },
  { code: 'DE', label: 'DE · Germany' },
  { code: 'GB', label: 'GB · United Kingdom' },
  { code: 'KR', label: 'KR · South Korea' },
];

export function ProductFilters({
  filters,
  onUpdateFilter,
  onReset,
  destinationCountry = 'IN',
  supportedCountries = [],
  onDestinationChange,
  preferredCurrency = 'INR',
  totalCount = 0,
}) {
  const categories = getAllCategories();

  const hasActiveFilters =
    Boolean(filters.query) ||
    (filters.category && filters.category !== 'ALL') ||
    Boolean(filters.subcategory) ||
    filters.originCountry !== 'ALL' ||
    filters.availability !== 'ALL' ||
    Boolean(filters.minBudget) ||
    Boolean(filters.maxBudget) ||
    filters.sortBy !== 'landed_asc';

  return (
    <section
      aria-label="Catalog filters"
      className="rounded-lg border border-[#E5E7EB] bg-white p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
        {/* Search query */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label
            htmlFor="discover-search"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#697586]"
          >
            Search product or brand
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#697586]" />
            <Input
              id="discover-search"
              type="text"
              value={filters.query}
              onChange={(e) => onUpdateFilter('query', e.target.value)}
              placeholder="Shoes, headphones, skincare..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Category selector (All 15 Categories) */}
        <div className="lg:col-span-2">
          <label
            htmlFor="discover-category"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#697586]"
          >
            Category
          </label>
          <Select
            value={filters.category || 'ALL'}
            onValueChange={(val) => onUpdateFilter('category', val)}
          >
            <SelectTrigger id="discover-category" aria-label="Product category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Destination Selector */}
        {supportedCountries.length > 0 && onDestinationChange ? (
          <div className="lg:col-span-2">
            <label
              htmlFor="discover-destination"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#697586]"
            >
              Deliver to
            </label>
            <Select
              value={destinationCountry}
              onValueChange={onDestinationChange}
            >
              <SelectTrigger id="discover-destination" aria-label="Destination country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedCountries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.code} · {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {/* Origin market */}
        <div className="lg:col-span-2">
          <label
            htmlFor="discover-origin"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#697586]"
          >
            Ships from
          </label>
          <Select
            value={filters.originCountry}
            onValueChange={(val) => onUpdateFilter('originCountry', val)}
          >
            <SelectTrigger id="discover-origin" aria-label="Ships from">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORIGIN_MARKETS.map((m) => (
                <SelectItem key={m.code} value={m.code}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Availability */}
        <div className="lg:col-span-1">
          <label
            htmlFor="discover-availability"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#697586] truncate"
          >
            Stock
          </label>
          <Select
            value={filters.availability}
            onValueChange={(val) => onUpdateFilter('availability', val)}
          >
            <SelectTrigger id="discover-availability" aria-label="Availability">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="IN_STOCK">In stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price range: Max landed budget */}
        <div className="lg:col-span-1">
          <label
            htmlFor="discover-budget"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#697586] truncate"
          >
            Max ({preferredCurrency})
          </label>
          <Input
            id="discover-budget"
            type="number"
            min="0"
            step="500"
            value={filters.maxBudget}
            onChange={(e) => onUpdateFilter('maxBudget', e.target.value)}
            placeholder="Any"
            className="px-2.5 tabular-nums"
          />
        </div>

        {/* Sort */}
        <div className="lg:col-span-1">
          <label
            htmlFor="discover-sort"
            className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-[#697586]"
          >
            Sort
          </label>
          <Select
            value={filters.sortBy}
            onValueChange={(val) => onUpdateFilter('sortBy', val)}
          >
            <SelectTrigger id="discover-sort" aria-label="Sort offers">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="landed_asc">Lowest delivered cost</SelectItem>
              <SelectItem value="price_asc">Lowest item price</SelectItem>
              <SelectItem value="fastest">Fastest delivery</SelectItem>
              <SelectItem value="rating_desc">Top rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] pt-3 text-[12px] text-[#697586]">
        <span className="tabular-nums">
          Showing <strong className="font-[600] text-[#17202F]">{totalCount}</strong> available offer
          {totalCount === 1 ? '' : 's'}
        </span>

        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 px-2 text-[12px] text-[#697586] hover:text-[#17202F]"
          >
            <RotateCcw className="h-3 w-3" />
            Reset filters
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export default ProductFilters;
