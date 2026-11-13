/**
 * Mock Landed Cost Calculator (Isolated Frontend Mock Layer)
 * NOTE: In production / live backend mode, NEVER calculate authoritative payment
 * totals on the frontend — always fetch them from POST /api/checkout/calculate.
 * This module exists strictly for standalone mock UI development when backend is offline.
 */
import { convertMockAmount, getMockExchangeRate } from './mockExchangeRates';
import { getMockShippingOptions } from './mockShipping';

const COUNTRY_DUTY_PROFILES = {
  IN: { taxName: 'IGST (18%)', taxRate: 0.18, dutyMultiplier: 1.0, clearanceFeeUsd: 4.5 },
  US: { taxName: 'Estimated State Sales Tax', taxRate: 0.08, dutyMultiplier: 0.25, clearanceFeeUsd: 0 },
  GB: { taxName: 'UK Import VAT (20%)', taxRate: 0.2, dutyMultiplier: 0.35, clearanceFeeUsd: 3.5 },
  DE: { taxName: 'EU Import VAT (19%)', taxRate: 0.19, dutyMultiplier: 0.35, clearanceFeeUsd: 3.5 },
  SG: { taxName: 'Singapore GST (9%)', taxRate: 0.09, dutyMultiplier: 0.0, clearanceFeeUsd: 2.0 },
  AE: { taxName: 'UAE VAT + Duty (5%)', taxRate: 0.05, dutyMultiplier: 0.4, clearanceFeeUsd: 2.5 },
  JP: { taxName: 'Japan Consumption Tax (10%)', taxRate: 0.1, dutyMultiplier: 0.3, clearanceFeeUsd: 2.0 },
  CA: { taxName: 'GST/HST Estimate (13%)', taxRate: 0.13, dutyMultiplier: 0.35, clearanceFeeUsd: 3.0 },
  AU: { taxName: 'Australia GST (10%)', taxRate: 0.1, dutyMultiplier: 0.2, clearanceFeeUsd: 2.5 },
};

export function calculateMockCheckout({
  product,
  quantity = 1,
  destinationCountry = 'IN',
  targetCurrency = 'INR',
  shippingOptionId = 'ship-standard-intl',
}) {
  if (!product) {
    return null;
  }

  const qty = Math.max(1, Number(quantity) || 1);
  const originCountry = (product.merchant?.country || 'US').toUpperCase();
  const destCountry = String(destinationCountry || 'IN').toUpperCase();
  const currency = String(targetCurrency || 'INR').toUpperCase();

  const fx = getMockExchangeRate(product.originalCurrency, currency);
  const unitConverted = convertMockAmount(product.originalPrice, product.originalCurrency, currency);
  const shippingData = getMockShippingOptions({
    product,
    originCountry,
    destinationCountry: destCountry,
    targetCurrency: currency,
    quantity: qty,
  });

  if (!fx || !unitConverted) {
    return null;
  }

  if (!shippingData.available) {
    return {
      shippingAvailable: false,
      unavailableReason: shippingData.reason,
      originCountry,
      destinationCountry: destCountry,
      targetCurrency: currency,
      source: 'mock',
    };
  }

  const chosenShipping =
    shippingData.options.find((opt) => opt.id === shippingOptionId) || shippingData.defaultOption;

  const isDomestic = originCountry === destCountry;
  const profile = COUNTRY_DUTY_PROFILES[destCountry] || COUNTRY_DUTY_PROFILES.IN;

  const originalSubtotal = Number((product.originalPrice * qty).toFixed(2));
  const convertedProductSubtotal = Number((unitConverted.convertedAmount * qty).toFixed(2));

  // Cross-border PayPal / FX conversion transparency fee (~1.5% simulated spread)
  const fxFeeRate = product.originalCurrency === currency ? 0 : 0.015;
  const currencyConversionFee = Number((convertedProductSubtotal * fxFeeRate).toFixed(2));

  const shippingCost = chosenShipping.costInTargetCurrency ?? 0;

  // Duties & taxes apply to CIF (Cost + Insurance + Freight) on international orders
  const cifValue = convertedProductSubtotal + shippingCost;
  const effectiveDutyRate = isDomestic
    ? 0
    : Number(((product.dutyRate ?? 0.12) * profile.dutyMultiplier).toFixed(4));
  const estimatedDuties = Number((cifValue * effectiveDutyRate).toFixed(2));
  const estimatedTaxes = Number(((cifValue + estimatedDuties) * profile.taxRate).toFixed(2));

  const clearanceConv = convertMockAmount(
    isDomestic ? 0 : profile.clearanceFeeUsd,
    'USD',
    currency
  );
  const otherFees = clearanceConv ? clearanceConv.convertedAmount : 0;

  const totalPayable = Number(
    (
      convertedProductSubtotal +
      currencyConversionFee +
      shippingCost +
      estimatedDuties +
      estimatedTaxes +
      otherFees
    ).toFixed(2)
  );

  // PayPal sandbox checkout typically processes in a PayPal-supported currency (e.g. USD)
  const usdConv = convertMockAmount(totalPayable, currency, 'USD');

  const warnings = [];
  if (!isDomestic) {
    warnings.push(
      `Import duties (~${(effectiveDutyRate * 100).toFixed(1)}%) and ${profile.taxName} are estimates based on ${destCountry} customs rates. Some import charges may change when your package reaches customs.`
    );
  }
  if (product.originalCurrency !== currency) {
    warnings.push(
      `Exchange rate (${fx.rate.toFixed(4)}) is an estimate. PayPal confirms the final conversion rate when you pay.`
    );
  }
  if (product.availability === 'limited_stock') {
    warnings.push('Only a few units are left in stock — double-check availability before paying.');
  }

  return {
    checkoutSessionId: `mock-chk-${product.id}-${Date.now()}`,
    shippingAvailable: true,
    productId: product.id,
    productTitle: product.title,
    merchantName: product.merchant?.name,
    originCountry,
    destinationCountry: destCountry,
    quantity: qty,
    originalCurrency: product.originalCurrency,
    originalUnitPrice: product.originalPrice,
    originalSubtotal,
    targetCurrency: currency,
    exchangeRate: fx.rate,
    exchangeRateTimestamp: fx.timestamp,
    breakdown: {
      productPrice: convertedProductSubtotal,
      currencyConversionFee,
      shippingCharges: shippingCost,
      estimatedDuties,
      estimatedTaxes,
      taxLabel: profile.taxName,
      otherFees,
      otherFeesLabel: isDomestic ? 'Handling Fee' : 'Customs Brokerage & Carrier Handling',
      totalPayable,
      paypalSettlementCurrency: 'USD',
      paypalSettlementAmount: usdConv ? usdConv.convertedAmount : null,
    },
    shippingOption: chosenShipping,
    availableShippingOptions: shippingData.options,
    warnings,
    isEstimated: true,
    source: 'mock',
  };
}
