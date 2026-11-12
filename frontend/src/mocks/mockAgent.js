/**
 * Mock AI Shopping Assistant (Isolated Frontend Mock Layer)
 * Provides conversational responses + structured product recommendations
 * when VITE_USE_MOCK_API=true while backend FastAPI agent is being developed.
 */
import { MOCK_PRODUCTS } from './mockProducts';
import { calculateMockCheckout } from './mockCheckout';
import { formatCurrency } from '../utils/currencyFormatter';
import { matchCategoriesFromText } from '../data/categories';

function enrichProductWithEstimate(product, destinationCountry, targetCurrency) {
  const calc = calculateMockCheckout({
    product,
    quantity: 1,
    destinationCountry,
    targetCurrency,
  });

  if (!calc || !calc.shippingAvailable) {
    return {
      ...product,
      convertedPrice: null,
      targetCurrency,
      shippingCost: null,
      estimatedDutiesAndTaxes: null,
      totalLandedCost: null,
      deliveryEstimate:
        product.availability === 'out_of_stock' ? 'Currently out of stock' : 'Unavailable',
      shippingAvailable: false,
      unavailableReason: calc?.unavailableReason || 'Shipping unavailable',
      source: 'mock',
    };
  }

  return {
    ...product,
    convertedPrice: calc.breakdown.productPrice,
    targetCurrency,
    exchangeRate: calc.exchangeRate,
    exchangeRateTimestamp: calc.exchangeRateTimestamp,
    shippingCost: calc.breakdown.shippingCharges,
    estimatedDutiesAndTaxes: Number(
      (calc.breakdown.estimatedDuties + calc.breakdown.estimatedTaxes).toFixed(2)
    ),
    totalLandedCost: calc.breakdown.totalPayable,
    deliveryEstimate: calc.shippingOption?.etaLabel || '5–8 business days',
    shippingAvailable: true,
    checkoutPreview: calc,
    source: 'mock',
  };
}

function parseBudget(text) {
  const input = String(text || '');
  const explicitKeywordOrCurrency =
    input.match(
      /(?:budget(?:\s+is|\s+of|:)?|under|below|max(?:imum)?|within|around|up\s*to)\s*(?:₹|rs\.?|inr|\$|usd|€|eur|£|gbp|¥|jpy)?\s*([\d,]{3,7})/i
    ) ||
    input.match(/(?:₹|rs\.?|inr|\$|usd|€|eur|£|gbp|¥|jpy)\s*([\d,]{3,7})/i);

  if (!explicitKeywordOrCurrency) return null;
  const val = Number(explicitKeywordOrCurrency[1].replace(/,/g, ''));
  return Number.isFinite(val) && val >= 100 ? val : null;
}

const ORIGIN_COUNTRY_PATTERNS = [
  { code: 'JP', regex: /\b(?:from|in)\s+(?:the\s+)?(?:japan|tokyo|osaka|kyoto|uji)\b|\bjapanese\b/i },
  { code: 'KR', regex: /\b(?:from|in)\s+(?:the\s+)?(?:south\s+korea|korea|seoul)\b|\bkorean\b|\bk-beauty\b/i },
  { code: 'SG', regex: /\b(?:from|in)\s+(?:the\s+)?(?:singapore|changi)\b|\bsingaporean\b/i },
  { code: 'DE', regex: /\b(?:from|in)\s+(?:the\s+)?(?:germany|berlin|munich|hamburg)\b|\bgerman\b/i },
  { code: 'GB', regex: /\b(?:from|in)\s+(?:the\s+)?(?:uk|u\.k\.|united\s+kingdom|britain|london)\b|\bbritish\b/i },
  { code: 'US', regex: /\b(?:from|in)\s+(?:the\s+)?(?:us|usa|u\.s\.|united\s+states|america)\b|\bamerican\b/i },
];

function detectOriginOverrides(message) {
  const text = String(message || '');
  const codes = ORIGIN_COUNTRY_PATTERNS
    .filter((entry) => entry.regex.test(text))
    .map((entry) => entry.code);
  return [...new Set(codes)];
}

function detectQueryOverrides(message, defaultCountry, defaultCurrency) {
  const text = String(message || '').toLowerCase();
  let dest = defaultCountry;
  let curr = defaultCurrency;

  if (/\b(?:to|for|deliver(?:ed)?\s+to|ship(?:ped)?\s+to)\s+(?:the\s+)?(?:uk|united\s+kingdom|britain|london)\b/.test(text)) {
    dest = 'GB';
  } else if (/\b(?:to|for|deliver(?:ed)?\s+to|ship(?:ped)?\s+to)\s+(?:the\s+)?(?:us|usa|united\s+states)\b/.test(text)) {
    dest = 'US';
  } else if (/\b(?:to|deliver(?:ed)?\s+to|ship(?:ped)?\s+to)\s+singapore\b/.test(text)) {
    dest = 'SG';
  } else if (/\b(?:to|deliver(?:ed)?\s+to|ship(?:ped)?\s+to)\s+germany\b/.test(text)) {
    dest = 'DE';
  } else if (/\b(?:to|deliver(?:ed)?\s+to|ship(?:ped)?\s+to)\s+japan\b/.test(text)) {
    dest = 'JP';
  } else if (/\b(?:to|deliver(?:ed)?\s+to|ship(?:ped)?\s+to)\s+(?:south\s+)?korea\b/.test(text)) {
    dest = 'KR';
  } else if (/\b(?:to|deliver(?:ed)?\s+to|ship(?:ped)?\s+to)\s+india\b/.test(text)) {
    dest = 'IN';
  }

  const currMatch = text.match(/\b(?:in|currency)\s+(inr|usd|eur|gbp|jpy|sgd|krw|aed|cad|aud)\b/i);
  if (currMatch) {
    curr = currMatch[1].toUpperCase();
  }

  return { destCountry: dest, targetCurrency: curr };
}

export function generateMockAgentReply({
  message,
  conversationId,
  preferences = {},
}) {
  const showFullCosts = preferences.isAuthenticated !== false;
  const { destCountry, targetCurrency } = detectQueryOverrides(
    message,
    preferences.destinationCountry || 'IN',
    preferences.preferredCurrency || 'INR'
  );
  const query = (message || '').toLowerCase();
  const budget = parseBudget(message || '');

  const enrichedCatalog = MOCK_PRODUCTS.map((p) =>
    enrichProductWithEstimate(p, destCountry, targetCurrency)
  );

  // Specific match for Sony XM5 / Headphones scenario (Hackathon hero example)
  if (
    query.includes('xm5') ||
    query.includes('sony') ||
    query.includes('headphone')
  ) {
    const matched = enrichedCatalog.filter((p) =>
      p.tags.some((t) => ['sony', 'headphones'].includes(t))
    );
    const sorted = [...matched].sort(
      (a, b) => (a.totalLandedCost ?? Infinity) - (b.totalLandedCost ?? Infinity)
    );

    const xm5New = sorted.find((p) => p.id === 'prod-sony-xm5-amazon-us');
    const xm5Refurb = sorted.find((p) => p.id === 'prod-sony-xm5-bestbuy-us');
    const xm4 = sorted.find((p) => p.id === 'prod-sony-xm4-amazon-us');

    const budgetText = budget
      ? formatCurrency(budget, targetCurrency, { compact: true })
      : formatCurrency(25000, targetCurrency, { compact: true });

    const replyParts = showFullCosts
      ? [
          `Your budget is **${budgetText}**, so let's see which US Sony headphone options fit once shipping and est. duties to **${destCountry}** are added (shown in **${targetCurrency}**):`,
          xm5New
            ? `• **Brand-New Sony WH-1000XM5 (Amazon US)**: The seller's price is **${formatCurrency(xm5New.originalPrice, xm5New.originalCurrency)}** (~**${formatCurrency(xm5New.convertedPrice, targetCurrency, { compact: true })}**), which looks inside **${budgetText}** upfront — once you add shipping (~${formatCurrency(xm5New.shippingCost, targetCurrency, { compact: true })}) and est. duties & GST (~${formatCurrency(xm5New.estimatedDutiesAndTaxes, targetCurrency, { compact: true })}), the **estimated delivered cost** comes to **${formatCurrency(xm5New.totalLandedCost, targetCurrency, { compact: true })}**.`
            : '',
          xm5Refurb
            ? `• **Closest XM5 to ${budgetText}**: The **Authorized Refurbished Sony WH-1000XM5** comes to around **${formatCurrency(xm5Refurb.totalLandedCost, targetCurrency, { compact: true })}** delivered in ${xm5Refurb.deliveryEstimate}.`
            : '',
          xm4
            ? `• **Under-Budget Option**: The **Sony WH-1000XM4** comes to **${formatCurrency(xm4.totalLandedCost, targetCurrency, { compact: true })}** all-in, keeping you comfortably under ${budgetText}.`
            : '',
          `Pick an offer below to compare fees side by side or review it in checkout. Some import charges may change when your package reaches customs.`,
        ].filter(Boolean)
      : [
          `Here are the matching US Sony headphone offers shown in each seller's currency:`,
          xm5New
            ? `• **Brand-New Sony WH-1000XM5 (Amazon US)**: Seller price **${formatCurrency(xm5New.originalPrice, xm5New.originalCurrency)}** (sold in ${xm5New.merchant?.country}).`
            : '',
          xm5Refurb
            ? `• **Authorized Refurbished Sony WH-1000XM5 (Best Buy US)**: Seller price **${formatCurrency(xm5Refurb.originalPrice, xm5Refurb.originalCurrency)}** (sold in ${xm5Refurb.merchant?.country}).`
            : '',
          xm4
            ? `• **Sony WH-1000XM4 (Amazon US)**: Seller price **${formatCurrency(xm4.originalPrice, xm4.originalCurrency)}** (sold in ${xm4.merchant?.country}).`
            : '',
          `Sign in to convert these prices into your preferred currency and view shipping fees, duties, and delivery timelines.`,
        ].filter(Boolean);

    return {
      conversationId: conversationId || `mock-conv-${Date.now()}`,
      reply: replyParts.join('\n\n'),
      products: sorted,
      intent: {
        detectedBudget: budget,
        detectedOrigin: query.includes('usa') || query.includes('us') ? 'US' : null,
        detectedDestination: showFullCosts ? destCountry : null,
        currency: showFullCosts ? targetCurrency : null,
        isAuthenticated: showFullCosts,
      },
      followUpPrompts: [
        'Compare all Sony options side by side',
        'Why are import duties and IGST this amount?',
        'Show faster express shipping for Sony WH-1000XM5',
      ],
      source: 'mock',
    };
  }

  // Category, origin & keyword matching across all 15 marketplace departments
  const detectedOrigins = detectOriginOverrides(message || '');
  const detectedCategories = matchCategoriesFromText(message || '');
  const detectedCategorySlugs = new Set(detectedCategories.map((c) => c.slug));

  const stopWords = new Set([
    'want', 'buy', 'from', 'with', 'best', 'find', 'show', 'the', 'and', 'for',
    'india', 'budget', 'deliver', 'delivered', 'ship', 'shipped', 'under', 'below',
    'compare', 'landed', 'cost', 'price', 'prices', 'options', 'items', 'products',
    'japan', 'japanese', 'korea', 'korean', 'south', 'singapore', 'germany', 'german',
    'britain', 'british', 'united', 'states', 'kingdom', 'usa', 'uk', 'inr', 'usd',
  ]);

  const keywords = query
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  const scored = enrichedCatalog
    .filter((p) => p.availability !== 'out_of_stock')
    .map((p) => {
      const haystack = `${p.title} ${p.shortTitle || ''} ${p.brand} ${p.category} ${p.subcategory || ''} ${p.merchant?.name} ${p.merchant?.country} ${(p.tags || []).join(' ')} ${(p.highlights || []).join(' ')}`.toLowerCase();
      let score = 0;
      let topicMatch = false;

      if (detectedCategorySlugs.has(p.categorySlug)) {
        score += 4;
        topicMatch = true;
      }
      if (detectedOrigins.includes(p.merchant?.country)) {
        score += 3;
      }
      for (const kw of keywords) {
        if (haystack.includes(kw)) {
          score += 2;
          topicMatch = true;
        }
      }
      return { product: p, score, topicMatch };
    })
    .filter((item) => item.score > 0);

  let matched = [];
  if (scored.length > 0) {
    const hasTopicIntent = detectedCategorySlugs.size > 0 || keywords.length > 0;
    const topicFiltered = hasTopicIntent
      ? scored.filter((item) => item.topicMatch)
      : scored;
    const basePool = topicFiltered.length > 0 ? topicFiltered : scored;

    const originScoped =
      detectedOrigins.length > 0
        ? basePool.filter((item) => detectedOrigins.includes(item.product.merchant?.country))
        : basePool;
    const pool = originScoped.length > 0 ? originScoped : basePool;

    pool.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.product.totalLandedCost ?? Infinity) - (b.product.totalLandedCost ?? Infinity);
    });
    matched = pool.map((item) => item.product);
  } else {
    matched = enrichedCatalog
      .filter((p) => p.availability !== 'out_of_stock')
      .slice(0, 6);
  }

  let budgetNote = '';
  if (budget) {
    const strictWithinBudget = matched.filter(
      (p) => p.totalLandedCost !== null && p.totalLandedCost <= budget * 1.1
    );
    if (strictWithinBudget.length > 0) {
      matched = strictWithinBudget;
    } else if (matched[0]?.totalLandedCost) {
      budgetNote = ` Note: after shipping and est. customs duties, the closest option comes to around **${formatCurrency(matched[0].totalLandedCost, targetCurrency, { compact: true })}** against your **${formatCurrency(budget, targetCurrency, { compact: true })}** budget.`;
    }
  }

  const sorted = [...matched].sort(
    (a, b) => (a.totalLandedCost ?? Infinity) - (b.totalLandedCost ?? Infinity)
  );

  const top = sorted[0];
  const deptLabel =
    detectedCategories.length > 0
      ? detectedCategories.map((c) => c.name).join(' & ')
      : top?.category || 'catalogue';

  const budgetIntro = budget
    ? `Your budget is **${formatCurrency(budget, targetCurrency, { compact: true })}**, so let's see which options fit. `
    : '';

  const reply = top
    ? showFullCosts
      ? `${budgetIntro}I found **${sorted.length}** offer${sorted.length > 1 ? 's' : ''} in **${deptLabel}** shipping to **${destCountry}** (shown in **${targetCurrency}**).\n\nLowest estimated delivered cost: **${top.shortTitle || top.title}** from **${top.merchant?.name}** (${top.merchant?.country}) — seller price **${formatCurrency(top.originalPrice, top.originalCurrency)}** (~**${formatCurrency(top.convertedPrice, targetCurrency, { compact: true })}**), shipping **${formatCurrency(top.shippingCost, targetCurrency, { compact: true })}**, est. duties **${formatCurrency(top.estimatedDutiesAndTaxes, targetCurrency, { compact: true })}**, for an estimated total of **${formatCurrency(top.totalLandedCost, targetCurrency, { compact: true })}** (${top.deliveryEstimate}). Some import charges may change when your package reaches customs.${budgetNote}`
      : `I found **${sorted.length}** offer${sorted.length > 1 ? 's' : ''} in **${deptLabel}**.\n\nFeatured seller offer: **${top.shortTitle || top.title}** from **${top.merchant?.name}** (${top.merchant?.country}) — seller price **${formatCurrency(top.originalPrice, top.originalCurrency)}**.\n\nSign in to convert prices into your preferred currency and view shipping fees, import duties, and delivery timelines.`
    : `We couldn't find an exact seller match right now. Try asking for running shoes from Japan, espresso machines from Germany, Korean skincare serums, jackets from the UK, or laptops from the US.`;

  const contextualFollowUps = [
    'Compare the lowest delivered cost options',
    detectedCategorySlugs.has('beauty-personal-care')
      ? 'Compare shipping times between Korea and Singapore'
      : 'Show Korean skincare serums with customs estimate',
    detectedCategorySlugs.has('home-kitchen')
      ? 'Show coffee gear in EUR currency'
      : 'Find compact espresso machines from Germany',
    'Find carry-on travel backpacks under ₹28,000',
  ];

  return {
    conversationId: conversationId || `mock-conv-${Date.now()}`,
    reply,
    products: sorted.slice(0, 6),
    intent: {
      detectedBudget: budget,
      detectedOrigins,
      detectedCategories: detectedCategories.map((c) => c.slug),
      detectedDestination: showFullCosts ? destCountry : null,
      currency: showFullCosts ? targetCurrency : null,
      isAuthenticated: showFullCosts,
    },
    followUpPrompts: contextualFollowUps,
    source: 'mock',
  };
}
