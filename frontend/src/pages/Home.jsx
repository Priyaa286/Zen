import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  DollarSign,
  Globe2,
  Lock,
  Package,
  Plane,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ProductImage } from '@/components/common/ProductImage';
import { ZenLogo } from '@/components/common/ZenLogo';
import { SEOHead } from '@/components/common/SEOHead';
import { CategoryGrid } from '@/components/marketplace/CategoryGrid';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductGridSkeleton } from '@/components/common/Loader';
import { FadeIn } from '@/components/motion/FadeIn';
import { RevealOnScroll } from '@/components/motion/RevealOnScroll';
import { SmoothCarousel } from '@/components/motion/SmoothCarousel';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { searchProducts } from '@/services/productService';
import { MOCK_PRODUCTS } from '@/mocks/mockProducts';
import { calculateMockCheckout } from '@/mocks/mockCheckout';
import {
  formatConvertedUserPrice,
  formatOriginalMerchantPrice,
  getCountryName,
} from '@/utils/currencyFormatter';
import { cn } from '@/utils/cn';

const HERO_COLLAGE = [
  {
    id: 'prod-asics-kayano-jp',
    label: 'Tokyo · Running',
    image: '/images/products/running-shoes.jpg',
    slug: 'sports-outdoors',
  },
  {
    id: 'prod-espresso-barista-de',
    label: 'Germany · Espresso',
    image: '/images/products/espresso-machine.jpg',
    slug: 'home-kitchen',
  },
  {
    id: 'prod-kbeauty-serum-kr',
    label: 'Seoul · Skincare',
    image: '/images/products/skincare-serum.jpg',
    slug: 'beauty-personal-care',
  },
  {
    id: 'prod-sony-xm5-amazon-us',
    label: 'USA · ANC Audio',
    image: '/images/products/sony-xm5.jpg',
    slug: 'electronics',
  },
];

const POPULAR_SEARCH_CHIPS = [
  { label: 'Japanese running shoes', to: '/results?category=sports-outdoors&origin=JP' },
  { label: 'German espresso machines', to: '/results?category=home-kitchen&origin=DE' },
  { label: 'Korean skincare', to: '/results?category=beauty-personal-care&origin=KR' },
  { label: 'Sony noise-canceling headphones', to: '/results?category=electronics&origin=US' },
  { label: 'London heritage outerwear', to: '/results?category=fashion&origin=GB' },
];

const WORLD_HUBS = [
  {
    code: 'US',
    flag: '🇺🇸',
    name: 'United States',
    specialty: 'Tech, audio, sportswear & flagship electronics',
    merchants: 'Amazon US, B&H Photo, Peak Design',
  },
  {
    code: 'JP',
    flag: '🇯🇵',
    name: 'Japan',
    specialty: 'Precision electronics, stationery, tea & running',
    merchants: 'Yodobashi Camera, Kitamura, Mizuno',
  },
  {
    code: 'DE',
    flag: '🇩🇪',
    name: 'Germany',
    specialty: 'Kitchen appliances, tools, watches & studio audio',
    merchants: 'CoffeeCircle Berlin, Otto Studio, Bosch',
  },
  {
    code: 'GB',
    flag: '🇬🇧',
    name: 'United Kingdom',
    specialty: 'Heritage fashion, tea, books & architectural design',
    merchants: 'End. Clothing, Tate Publishing, Barbour',
  },
  {
    code: 'KR',
    flag: '🇰🇷',
    name: 'South Korea',
    specialty: 'Skincare, barrier beauty, K-pop & lifestyle design',
    merchants: 'Seoul Skin Atelier, Gentle Lab, Olive Direct',
  },
  {
    code: 'SG',
    flag: '🇸🇬',
    name: 'Singapore',
    specialty: 'Regional luxury hub, custom keyboards & ASEAN shipping',
    merchants: 'Keychron Asia, Sephira Singapore, Omnia SG',
  },
];

const CURATED_TABS = [
  {
    id: 'running',
    name: 'Running & Athletics',
    categorySlug: 'sports-outdoors',
    origin: 'JP',
    tagline: 'Precision performance footwear and athletic apparel from Tokyo and beyond',
    productIds: ['prod-asics-kayano-jp'],
  },
  {
    id: 'coffee',
    name: 'Specialty Coffee & Espresso',
    categorySlug: 'home-kitchen',
    origin: 'DE',
    tagline: 'Commercial-grade dual boiler machines and pour-over gear engineered in Germany',
    productIds: ['prod-espresso-barista-de', 'prod-matcha-ceremonial-jp'],
  },
  {
    id: 'skincare',
    name: 'Skincare Essentials',
    categorySlug: 'beauty-personal-care',
    origin: 'KR',
    tagline: 'Hydration and barrier repair formulations directly from Seoul flagships',
    productIds: ['prod-kbeauty-serum-kr'],
  },
  {
    id: 'audio',
    name: 'Audiophile & ANC Headphones',
    categorySlug: 'electronics',
    origin: 'US',
    tagline: 'World-renowned noise-canceling headphones and studio sound gear',
    productIds: ['prod-sony-xm5-amazon-us', 'prod-sony-xm5-bh-us', 'prod-synth-poly-us'],
  },
];

const TRANSPARENCY_SAMPLE_IDS = [
  'prod-asics-kayano-jp',
  'prod-barbour-field-uk',
  'prod-espresso-barista-de',
  'prod-kbeauty-serum-kr',
];

const HOME_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Zen Global',
    alternateName: 'Zen PayPal Borderless Buying Agent',
    url: 'https://zen.global',
    description:
      'Shop globally with Zen, your AI-powered borderless buying assistant. Compare international products, understand currency conversions and estimated landed costs, and checkout securely with PayPal.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://zen.global/results?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Zen Global',
    url: 'https://zen.global',
    logo: 'https://zen.global/assets/branding/zen_logo.svg',
    sameAs: ['https://twitter.com/ZenGlobal'],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Zen Shopping Agent',
    applicationCategory: 'ShoppingApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'AI shopping agent calculating landed costs, live FX conversions, and international air freight with secure PayPal checkout.',
  },
];

export function Home() {
  const navigate = useNavigate();
  const { destinationCountry, preferredCurrency, useMockApi } = useAppContext();
  const { isAuthenticated, user } = useAuth();

  // Section 3: Popular Products
  const [popularProducts, setPopularProducts] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);

  // Section 5: Curated Collections Tab
  const [activeCuratedTab, setActiveCuratedTab] = useState(CURATED_TABS[0].id);

  // Section 6: Interactive Transparency Ledger
  const [activeLedgerId, setActiveLedgerId] = useState(TRANSPARENCY_SAMPLE_IDS[0]);

  useEffect(() => {
    let active = true;
    setPopularLoading(true);
    searchProducts({
      availability: 'IN_STOCK',
      sortBy: 'rating_desc',
      destinationCountry,
      preferredCurrency,
    })
      .then((res) => {
        if (!active) return;
        const catalog = res.products || [];
        // Show 10 diverse top products
        setPopularProducts(catalog.slice(0, 10));
      })
      .catch(() => {
        if (active) setPopularProducts([]);
      })
      .finally(() => {
        if (active) setPopularLoading(false);
      });

    return () => {
      active = false;
    };
  }, [destinationCountry, preferredCurrency, useMockApi]);

  const transparencyProducts = useMemo(
    () =>
      TRANSPARENCY_SAMPLE_IDS.map((id) =>
        MOCK_PRODUCTS.find((p) => p.id === id)
      ).filter(Boolean),
    []
  );

  const activeSampleProduct =
    transparencyProducts.find((p) => p.id === activeLedgerId) || transparencyProducts[0];

  const activeLedgerCalc = useMemo(() => {
    if (!activeSampleProduct) return null;
    return calculateMockCheckout({
      product: activeSampleProduct,
      quantity: 1,
      destinationCountry,
      targetCurrency: preferredCurrency,
    });
  }, [activeSampleProduct, destinationCountry, preferredCurrency]);

  const currentCuratedConfig =
    CURATED_TABS.find((t) => t.id === activeCuratedTab) || CURATED_TABS[0];

  const curatedProducts = useMemo(() => {
    return popularProducts.filter((p) =>
      currentCuratedConfig.productIds.includes(p.id) ||
      p.categorySlug === currentCuratedConfig.categorySlug ||
      (currentCuratedConfig.origin && p.merchant?.country === currentCuratedConfig.origin)
    ).slice(0, 4);
  }, [popularProducts, currentCuratedConfig]);

  return (
    <div className="bg-[#F7F8FA] text-[#17202F]">
      <SEOHead
        title="Zen – AI-Powered Borderless Shopping with PayPal"
        description="Shop globally with Zen, your AI-powered borderless buying assistant. Compare international products, understand currency conversions and estimated landed costs, and checkout securely with PayPal."
        keywords="borderless shopping, cross-border ecommerce, international shopping assistant, currency conversion, landed cost, paypal checkout, import duties, global marketplace"
        canonical="/"
        jsonLd={HOME_JSON_LD}
      />

      {/* =========================================================================
          SECTION 1: HERO
          Balanced vertical height, clean typography, compact search prompt chips
          ========================================================================= */}
      <section aria-labelledby="hero-heading" className="border-b border-[#E5E7EB] bg-white">
        <div className="zen-container grid grid-cols-1 items-center gap-10 py-10 sm:py-14 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            {/* Country / Currency Awareness Badge */}
            <FadeIn delay={0.04} direction="up">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1 text-[12px] font-medium text-[#697586]">
                <Globe2 className="h-3.5 w-3.5 text-[#465BE5]" />
                <span>
                  {isAuthenticated ? (
                    <>
                      {user?.fullName ? `Welcome back, ${user.fullName.split(' ')[0]} · ` : ''}
                      Shipping to{' '}
                      <strong className="font-[600] text-[#17202F]">
                        {getCountryName(destinationCountry)} ({destinationCountry})
                      </strong>{' '}
                      · Prices in <strong className="font-[600] text-[#17202F]">{preferredCurrency}</strong>
                    </>
                  ) : (
                    <>
                      International marketplace · Showing{' '}
                      <strong className="font-[600] text-[#17202F]">seller&apos;s local currency</strong>{' '}
                      · Sign in for currency conversion &amp; delivery
                    </>
                  )}
                </span>
              </div>
            </FadeIn>

            {/* Main Headline */}
            <FadeIn delay={0.08} direction="up">
              <div className="space-y-2">
                <h1
                  id="hero-heading"
                  className="text-[32px] font-[750] leading-[1.1] tracking-[-0.03em] text-[#172554] sm:text-[44px] lg:text-[48px]"
                >
                  Zen – AI-Powered Borderless Shopping with PayPal
                </h1>
                <p className="text-[18px] sm:text-[20px] font-semibold text-[#17202F]">
                  A world of products. One place to shop.
                </p>
              </div>
            </FadeIn>

            {/* Description */}
            <FadeIn delay={0.14} direction="up">
              <p className="max-w-xl text-[16px] leading-[1.6] text-[#697586]">
                Explore authentic products from the USA, Japan, Germany, and beyond. Compare prices in your local currency, see full landed costs upfront, and pay securely with PayPal.
              </p>
            </FadeIn>

            {/* Popular Search Prompt Chips (compact, no duplicate search input) */}
            <FadeIn delay={0.2} direction="up">
              <div className="space-y-2">
                <span className="text-[11.5px] font-[600] uppercase tracking-[0.06em] text-[#697586]">
                  Popular International Searches:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {POPULAR_SEARCH_CHIPS.map((chip) => (
                    <Link
                      key={chip.label}
                      to={chip.to}
                      className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-[#F7F8FA] px-3 py-1 text-[12.5px] font-medium text-[#17202F] transition-colors hover:border-[#465BE5] hover:text-[#465BE5]"
                    >
                      <span>{chip.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Dual Shopping CTAs */}
            <FadeIn delay={0.26} direction="up">
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/results')}
                  className="bg-[#172554] px-6 text-[14px] hover:bg-[#1E3A8A]"
                >
                  <span>Start shopping</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/assistant')}
                  className="border-[#E5E7EB] bg-white px-5 text-[14px]"
                >
                  <Sparkles className="h-4 w-4 text-[#465BE5]" />
                  <span>Ask Shopping Assistant</span>
                </Button>
              </div>
            </FadeIn>
          </div>

          {/* Right Product Image Collage */}
          <FadeIn delay={0.16} direction="up" className="grid grid-cols-2 gap-3.5 lg:col-span-5">
            {HERO_COLLAGE.map((card, idx) => (
              <Link
                key={card.id}
                to={`/results?category=${encodeURIComponent(card.slug)}`}
                className="group relative overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F1F3F6] shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#465BE5]"
              >
                <div className="aspect-[4/3] w-full">
                  <ProductImage
                    src={card.image}
                    alt={card.label}
                    className="h-full w-full"
                    imgClassName="group-hover:scale-[1.04] transition-transform duration-300"
                    fit="cover"
                    loading={idx < 2 ? 'eager' : 'lazy'}
                    fetchPriority={idx === 0 ? 'high' : 'auto'}
                    width={320}
                    height={240}
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17202F]/80 via-[#17202F]/35 to-transparent px-3 py-2">
                  <p className="text-[12px] font-[650] text-white">{card.label}</p>
                </div>
              </Link>
            ))}
          </FadeIn>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: SHOP BY CATEGORY
          Visual 12-department grid
          ========================================================================= */}
      <RevealOnScroll>
        <CategoryGrid />
      </RevealOnScroll>

      {/* =========================================================================
          SECTION 3: POPULAR INTERNATIONAL PRODUCTS
          Responsive merchandising grid (4-5 per row on desktop)
          ========================================================================= */}
      <RevealOnScroll>
        <section aria-labelledby="popular-products-heading" className="border-t border-[#E5E7EB] bg-white py-12 sm:py-16">
          <div className="zen-container space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="zen-eyebrow text-[#465BE5]">Curated Selection</p>
                <h2
                  id="popular-products-heading"
                  className="mt-1 text-[24px] sm:text-[30px] font-[680] tracking-[-0.025em] text-[#17202F]"
                >
                  Popular International Products
                </h2>
                <p className="mt-1 text-[14px] text-[#697586]">
                  Top-rated items from verified sellers worldwide with transparent shipping and customs.
                </p>
              </div>

              <Link
                to="/results"
                className="inline-flex items-center gap-1.5 text-[13.5px] font-[600] text-[#172554] hover:text-[#465BE5]"
              >
                <span>View all products</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {popularLoading ? (
              <ProductGridSkeleton count={8} />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {popularProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      </RevealOnScroll>

      {/* =========================================================================
          SECTION 4: SHOP FROM AROUND THE WORLD
          Country-based product discovery tiles
          ========================================================================= */}
      <RevealOnScroll>
        <section aria-labelledby="around-the-world-heading" className="border-t border-[#E5E7EB] bg-[#F7F8FA] py-12 sm:py-16">
          <div className="zen-container space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="zen-eyebrow text-[#465BE5]">Global Flagships</p>
                <h2
                  id="around-the-world-heading"
                  className="mt-1 text-[24px] sm:text-[30px] font-[680] tracking-[-0.025em] text-[#17202F]"
                >
                  Shop from Around the World
                </h2>
                <p className="mt-1 text-[14px] text-[#697586]">
                  Direct fulfillment from authorized merchants across six retail markets.
                </p>
              </div>

              <Link
                to="/results"
                className="text-[13px] font-[600] text-[#465BE5] hover:underline"
              >
                Browse all countries →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WORLD_HUBS.map((hub) => (
                <Link
                  key={hub.code}
                  to={`/results?origin=${encodeURIComponent(hub.code)}`}
                  className="group flex flex-col justify-between rounded-xl border border-[#E5E7EB] bg-white p-5 transition-all hover:border-[#465BE5]/60 hover:shadow-card"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[20px]">{hub.flag}</span>
                        <span className="text-[16px] font-[700] text-[#172554] group-hover:text-[#465BE5]">
                          {hub.name}
                        </span>
                      </div>
                      <span className="rounded bg-[#F1F3F6] px-2 py-0.5 text-[11px] font-[600] text-[#697586]">
                        {hub.code}
                      </span>
                    </div>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-[#697586]">
                      {hub.specialty}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-[12px]">
                    <span className="truncate text-[#697586]">{hub.merchants}</span>
                    <span className="shrink-0 font-[600] text-[#172554] group-hover:text-[#465BE5]">
                      Shop {hub.code} →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* =========================================================================
          SECTION 5: TRENDING CATEGORIES / CURATED COLLECTIONS
          Tabbed multi-category showcases with Smooth Carousel
          ========================================================================= */}
      <RevealOnScroll>
        <section aria-labelledby="curated-collections-heading" className="border-t border-[#E5E7EB] bg-white py-12 sm:py-16">
          <div className="zen-container space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="zen-eyebrow text-[#465BE5]">Curated Collections</p>
                <h2
                  id="curated-collections-heading"
                  className="mt-1 text-[24px] sm:text-[30px] font-[680] tracking-[-0.025em] text-[#17202F]"
                >
                  Trending Department Highlights
                </h2>
                <p className="mt-1 text-[14px] text-[#697586]">
                  Featured categories handpicked for craftsmanship, international value, and direct merchant fulfillment.
                </p>
              </div>

              <Link
                to={`/results?category=${encodeURIComponent(currentCuratedConfig.categorySlug)}`}
                className="text-[13px] font-[600] text-[#465BE5] hover:underline"
              >
                Explore {currentCuratedConfig.name} →
              </Link>
            </div>

            {/* Tab buttons */}
            <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-3">
              {CURATED_TABS.map((tab) => {
                const active = tab.id === activeCuratedTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCuratedTab(tab.id)}
                    className={cn(
                      'rounded-lg px-3.5 py-1.5 text-[13px] font-[600] transition-colors',
                      active
                        ? 'bg-[#172554] text-white shadow-sm'
                        : 'border border-[#E5E7EB] bg-[#F7F8FA] text-[#697586] hover:text-[#17202F]'
                    )}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-4 text-[13px] text-[#697586] flex flex-wrap items-center justify-between gap-2">
              <span>{currentCuratedConfig.tagline}</span>
              <Link
                to={`/results?category=${encodeURIComponent(currentCuratedConfig.categorySlug)}`}
                className="font-[600] text-[#172554] hover:text-[#465BE5]"
              >
                View all in this department →
              </Link>
            </div>

            <SmoothCarousel
              itemClassName="w-[260px] sm:w-[280px]"
              gap={16}
              showControls
            >
              {curatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </SmoothCarousel>
          </div>
        </section>
      </RevealOnScroll>

      {/* =========================================================================
          SECTION 6: WHY SHOP WITH ZEN (PLATFORM BENEFITS)
          Concrete platform value propositions & interactive pricing ledger
          ========================================================================= */}
      <RevealOnScroll>
        <section aria-labelledby="why-shop-heading" className="border-t border-[#E5E7EB] bg-[#F7F8FA] py-12 sm:py-16">
        <div className="zen-container space-y-8">
          <div className="max-w-2xl">
            <p className="zen-eyebrow text-[#15976B]">Platform Principles</p>
            <h2
              id="why-shop-heading"
              className="mt-1 text-[24px] sm:text-[30px] font-[680] tracking-[-0.025em] text-[#17202F]"
            >
              Why Shop with Zen Global
            </h2>
            <p className="mt-1 text-[14px] text-[#697586]">
              Designed from the ground up for transparent cross-border commerce without hidden surprises.
            </p>
          </div>

          {/* 4 Concrete Value Propositions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F1F3F6] text-[#172554]">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="text-[15px] font-[680] text-[#17202F]">Transparent Pricing</h3>
              <p className="text-[13px] leading-relaxed text-[#697586]">
                See the seller&apos;s original price and converted price side-by-side using real-time market exchange rates.
              </p>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F1F3F6] text-[#465BE5]">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="text-[15px] font-[680] text-[#17202F]">Landed Cost Calculation</h3>
              <p className="text-[13px] leading-relaxed text-[#697586]">
                Shipping fees, customs duties, and import taxes are calculated and itemized before you enter checkout.
              </p>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F1F3F6] text-[#D97706]">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <h3 className="text-[15px] font-[680] text-[#17202F]">Direct from Source</h3>
              <p className="text-[13px] leading-relaxed text-[#697586]">
                Authentic merchandise dispatched straight from verified international merchants and official flagships.
              </p>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F1F3F6] text-[#15976B]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-[15px] font-[680] text-[#17202F]">PayPal Buyer Protection</h3>
              <p className="text-[13px] leading-relaxed text-[#697586]">
                Safe, encrypted payments with comprehensive PayPal protection. You always confirm before any funds move.
              </p>
            </div>
          </div>

          {/* Interactive Live Ledger Breakdown Demo */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
              <div>
                <span className="text-[11px] font-[600] uppercase tracking-[0.06em] text-[#465BE5]">
                  Interactive Demonstration
                </span>
                <h3 className="text-[18px] font-[700] text-[#17202F]">
                  Itemized International Checkout Preview
                </h3>
              </div>
              {/* Product switchers */}
              <div className="flex flex-wrap gap-1.5">
                {transparencyProducts.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => setActiveLedgerId(sample.id)}
                    className={cn(
                      'rounded-full px-3 py-1 text-[12px] font-[580] transition-colors',
                      activeLedgerId === sample.id
                        ? 'bg-[#172554] text-white'
                        : 'border border-[#E5E7EB] bg-[#F7F8FA] text-[#697586] hover:text-[#17202F]'
                    )}
                  >
                    {sample.brand} ({sample.originalCurrency})
                  </button>
                ))}
              </div>
            </div>

            {activeSampleProduct && isAuthenticated && activeLedgerCalc?.shippingAvailable ? (
              <div className="mt-5 rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
                  <div>
                    <p className="text-[11px] font-[600] uppercase tracking-[0.06em] text-[#697586]">
                      {activeSampleProduct.merchant?.name} · {getCountryName(activeSampleProduct.merchant?.country)} →{' '}
                      {destinationCountry}
                    </p>
                    <p className="text-[15px] font-[650] text-[#17202F]">
                      {activeSampleProduct.shortTitle || activeSampleProduct.title}
                    </p>
                  </div>
                  <Link
                    to={`/product/${encodeURIComponent(activeSampleProduct.id)}`}
                    className="shrink-0 text-[12px] font-[600] text-[#465BE5] hover:underline"
                  >
                    Inspect details →
                  </Link>
                </div>

                <dl className="space-y-2 text-[13px] tabular-nums">
                  <div className="flex justify-between">
                    <dt className="text-[#697586]">Price in seller&apos;s currency</dt>
                    <dd className="font-[600] text-[#17202F]">
                      {formatOriginalMerchantPrice(
                        activeSampleProduct.originalPrice,
                        activeSampleProduct.originalCurrency
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#697586]">
                      Converted price ({preferredCurrency} · 1 {activeSampleProduct.originalCurrency} ={' '}
                      {activeLedgerCalc.exchangeRate?.toFixed(2)} {preferredCurrency})
                    </dt>
                    <dd className="font-[600] text-[#17202F]">
                      {formatConvertedUserPrice(
                        activeLedgerCalc.breakdown.productPrice,
                        preferredCurrency,
                        { compact: true }
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#697586]">
                      Delivery ({activeLedgerCalc.shippingOption?.etaLabel})
                    </dt>
                    <dd className="font-[600] text-[#17202F]">
                      {formatConvertedUserPrice(
                        activeLedgerCalc.breakdown.shippingCharges,
                        preferredCurrency,
                        { compact: true }
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#697586]">Est. duties &amp; tax</dt>
                    <dd className="font-[600] text-[#17202F]">
                      {formatConvertedUserPrice(
                        activeLedgerCalc.breakdown.estimatedDuties +
                          activeLedgerCalc.breakdown.estimatedTaxes,
                        preferredCurrency,
                        { compact: true }
                      )}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-[#E5E7EB] pt-3">
                    <dt className="text-[14px] font-[680] text-[#17202F]">
                      Total payable at checkout
                    </dt>
                    <dd className="text-[22px] font-[720] text-[#172554]">
                      {formatConvertedUserPrice(
                        activeLedgerCalc.breakdown.totalPayable,
                        preferredCurrency,
                        { compact: true }
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : activeSampleProduct ? (
              <div className="mt-5 rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
                  <div>
                    <p className="text-[11px] font-[600] uppercase tracking-[0.06em] text-[#697586]">
                      {activeSampleProduct.merchant?.name} · Sold in{' '}
                      {getCountryName(activeSampleProduct.merchant?.country)}
                    </p>
                    <p className="text-[15px] font-[650] text-[#17202F]">
                      {activeSampleProduct.shortTitle || activeSampleProduct.title}
                    </p>
                  </div>
                  <Link
                    to={`/product/${encodeURIComponent(activeSampleProduct.id)}`}
                    className="shrink-0 text-[12px] font-[600] text-[#465BE5] hover:underline"
                  >
                    Inspect details →
                  </Link>
                </div>

                <div className="flex items-baseline justify-between border-b border-[#E5E7EB] pb-3 text-[13px] tabular-nums">
                  <span className="text-[#697586]">Price in seller&apos;s currency</span>
                  <span className="text-[18px] font-[700] text-[#172554]">
                    {formatOriginalMerchantPrice(
                      activeSampleProduct.originalPrice,
                      activeSampleProduct.originalCurrency
                    )}
                  </span>
                </div>

                <div className="rounded-md border border-[#E5E7EB] bg-white p-3.5 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#465BE5]" />
                    <div className="space-y-1">
                      <p className="text-[13px] font-[620] text-[#17202F]">
                        Sign in to view currency conversion &amp; delivery details
                      </p>
                      <p className="text-[12px] leading-relaxed text-[#697586]">
                        Guests see the seller&apos;s local currency. Sign in to convert prices to {preferredCurrency}, view delivery timelines, and access checkout.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <Link
                      to="/login"
                      className="inline-flex h-8 items-center rounded-md bg-[#172554] px-3.5 text-[12px] font-[600] text-white hover:bg-[#1E3A8A]"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex h-8 items-center rounded-md border border-[#E5E7EB] bg-[#F7F8FA] px-3 text-[12px] font-[580] text-[#17202F] hover:border-[#CBD5E1]"
                    >
                      Create account
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      </RevealOnScroll>

      {/* =========================================================================
          SECTION 7: SELL ON ZEN (MERCHANT ONBOARDING TEASER)
          Compact banner inviting international sellers to join
          ========================================================================= */}
      <RevealOnScroll>
        <section className="border-t border-[#E5E7EB] bg-gradient-to-r from-[#172554] to-[#1E3A8A] text-white py-12 sm:py-16">
          <div className="zen-container">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-white/90 backdrop-blur-sm">
                  <Store className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Multi-Vendor Global Marketplace</span>
                </div>
                <h2 className="text-[28px] sm:text-[36px] font-[720] tracking-[-0.025em] text-white leading-tight">
                  Have a store? Bring it to the world.
                </h2>
                <p className="text-[15px] leading-relaxed text-slate-200">
                  Reach international buyers with automated currency conversion, shipping estimates, and PayPal payments. Keep 95% of your sales with our flat 5% platform fee.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-[12.5px] text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Flat 5% platform fee
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Instant currency conversion
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Direct PayPal settlements
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  size="lg"
                  onClick={() => navigate('/sell')}
                  className="bg-white text-[#172554] hover:bg-slate-100 font-[650] px-6"
                >
                  <span>Start selling</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Link
                  to="/seller/register"
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-white/20 bg-white/5 px-5 text-[14px] font-medium text-white hover:bg-white/10"
                >
                  Open Merchant Store
                </Link>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>
    </div>
  );
}

export default Home;