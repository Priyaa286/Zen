/**
 * Mock International Shipping Intelligence (Isolated Frontend Mock Layer)
 */
import { convertMockAmount } from './mockExchangeRates';

const RESTRICTED_CORRIDORS = new Set([
  // Example edge-case corridor: US Lithium/high-wattage restrictions or unavailable demo route
]);

export function getMockShippingOptions({
  product,
  originCountry = 'US',
  destinationCountry = 'IN',
  targetCurrency = 'INR',
  quantity = 1,
}) {
  const origin = String(originCountry || product?.merchant?.country || 'US').toUpperCase();
  const dest = String(destinationCountry || 'IN').toUpperCase();
  const corridorKey = `${origin}->${dest}`;

  if (product?.availability === 'out_of_stock') {
    return {
      available: false,
      reason: 'This item is currently out of stock at the origin merchant and cannot be dispatched.',
      originCountry: origin,
      destinationCountry: dest,
      options: [],
      source: 'mock',
    };
  }

  if (RESTRICTED_CORRIDORS.has(corridorKey)) {
    return {
      available: false,
      reason: `International courier delivery from ${origin} to ${dest} is temporarily unavailable for this item category.`,
      originCountry: origin,
      destinationCountry: dest,
      options: [],
      source: 'mock',
    };
  }

  const baseUsd = typeof product?.baseShippingUsd === 'number' ? product.baseShippingUsd : 22;
  const qtyFactor = Math.max(1, Number(quantity) || 1);
  const weightMultiplier = 1 + (qtyFactor - 1) * 0.45;

  const isSameCountry = origin === dest;
  const standardUsd = isSameCountry
    ? Number((6.5 * weightMultiplier).toFixed(2))
    : Number((baseUsd * weightMultiplier).toFixed(2));
  const expressUsd = isSameCountry
    ? Number((12.0 * weightMultiplier).toFixed(2))
    : Number(((baseUsd + 14.5) * weightMultiplier).toFixed(2));

  const minDays = isSameCountry ? 2 : product?.estimatedDeliveryDays?.min ?? 5;
  const maxDays = isSameCountry ? 4 : product?.estimatedDeliveryDays?.max ?? 8;

  const convertOrNull = (usdAmount) => {
    const conv = convertMockAmount(usdAmount, 'USD', targetCurrency);
    return conv ? conv.convertedAmount : null;
  };

  const today = new Date();
  const formatEtaRange = (low, high) => {
    const d1 = new Date(today);
    d1.setDate(today.getDate() + low);
    const d2 = new Date(today);
    d2.setDate(today.getDate() + high);
    const fmt = (d) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(d1)} – ${fmt(d2)}`;
  };

  const options = [
    {
      id: 'ship-standard-intl',
      carrier: isSameCountry ? 'Domestic Tracked Courier' : 'DHL eCommerce / FedEx International Connect',
      serviceName: 'Tracked International Standard',
      costUsd: standardUsd,
      costInTargetCurrency: convertOrNull(standardUsd),
      currency: targetCurrency,
      minDays,
      maxDays,
      etaLabel: `${minDays}–${maxDays} business days`,
      estimatedArrivalWindow: formatEtaRange(minDays + 1, maxDays + 2),
      customsClearanceIncluded: true,
    },
    {
      id: 'ship-express-priority',
      carrier: 'DHL Express Priority Air',
      serviceName: 'Express Customs-Assisted Air',
      costUsd: expressUsd,
      costInTargetCurrency: convertOrNull(expressUsd),
      currency: targetCurrency,
      minDays: Math.max(2, minDays - 2),
      maxDays: Math.max(3, maxDays - 3),
      etaLabel: `${Math.max(2, minDays - 2)}–${Math.max(3, maxDays - 3)} business days`,
      estimatedArrivalWindow: formatEtaRange(Math.max(2, minDays - 2), Math.max(4, maxDays - 2)),
      customsClearanceIncluded: true,
    },
  ];

  return {
    available: true,
    originCountry: origin,
    destinationCountry: dest,
    options,
    defaultOption: options[0],
    source: 'mock',
  };
}
