from datetime import datetime, timezone, timedelta
import logging
import re
import uuid
from typing import Dict, List, Optional, Tuple
from urllib.parse import parse_qs, urlparse

from app.integrations.channel3_client import Channel3Client, channel3_client
from app.schemas.pricing_schema import CostItem, LandedCostQuote, LandedCostRequest
from app.services.currency_service import CurrencyService, currency_service
from app.services.shipping_service import ShippingService, shipping_service
from app.services.product_service import ProductService, product_service

logger = logging.getLogger("zen.services.pricing")

# In-memory cache for active quotes (quote_id -> LandedCostQuote)
# This is kept for backward compat with existing tests.
# Authoritative storage is now the SQLite database via QuoteRepository.
QUOTES_STORE: Dict[str, LandedCostQuote] = {}
DEFAULT_QUOTE_TTL_MINUTES = 15


def _extract_offer_id(url: Optional[str]) -> Optional[str]:
    """
    Extract the offer ID `o=<id>` from a Channel3 buy URL.
    Channel3 buy URLs look like:
    https://buy.trychannel3.com/zNQps8G-idcX-6CnVDQ?o=01M4H0RHC7JJGA9KQZW8FB9N8Z&aid=...
    The `aid` parameter is a transient affiliate/click identifier generated per request,
    while `o=` is the stable offer identifier.
    """
    if not url:
        return None
    try:
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        if "o" in params and params["o"]:
            return params["o"][0]
    except Exception:
        pass
    match = re.search(r"[?&]o=([A-Za-z0-9_-]+)", url)
    if match:
        return match.group(1)
    return None


def _matches_offer(offer_url: Optional[str], target_url: Optional[str]) -> bool:
    """
    Check if an offer URL matches the target requested offer URL.
    Matches either:
    1. Exact URL string
    2. Matching offer ID parameter `o=`
    3. Matching URL prefix up to `&aid=`
    """
    if not offer_url or not target_url:
        return False
    if offer_url == target_url:
        return True
    off_id = _extract_offer_id(offer_url)
    tgt_id = _extract_offer_id(target_url)
    if off_id and tgt_id and off_id == tgt_id:
        return True
    # Fallback: compare base URLs without the transient `aid` query parameter
    clean_off = re.sub(r"([?&])aid=[^&]*(&|$)", r"\1", offer_url).rstrip("?&")
    clean_tgt = re.sub(r"([?&])aid=[^&]*(&|$)", r"\1", target_url).rstrip("?&")
    return clean_off == clean_tgt


async def _persist_quote_to_db(quote: LandedCostQuote) -> None:
    """Best-effort persistence of a quote to the database.

    Errors are logged but never raised – the in-memory store remains
    the fallback so existing tests and pricing calculations still work
    even if the database is not initialised.
    """
    try:
        from app.database.connection import AsyncSessionLocal
        if AsyncSessionLocal is None:
            return  # DB not initialised (e.g. during unit tests)
        from app.repositories.quote_repository import QuoteRepository
        async with AsyncSessionLocal() as session:
            repo = QuoteRepository(session)
            await repo.save(quote)
    except Exception as exc:
        logger.warning("Could not persist quote %s to database: %s", quote.quote_id, exc)


class PricingService:
    """
    Service responsible for calculating destination-specific duties, taxes,
    and compiling complete LandedCostQuotes.
    """

    def __init__(
        self,
        c3_client: Optional[Channel3Client] = None,
        curr_service: Optional[CurrencyService] = None,
        ship_service: Optional[ShippingService] = None,
        prod_service: Optional[ProductService] = None,
    ):
        self.c3_client = c3_client or channel3_client
        self.currency_service = curr_service or currency_service
        self.shipping_service = ship_service or shipping_service
        self.product_service = prod_service or product_service

    def calculate_customs_and_taxes(
        self,
        product_price_converted: float,
        product_price_source: float,
        shipping_item: CostItem,
        destination_country: str,
        source_currency: str,
        destination_currency: str,
        exchange_rate: float,
    ) -> Tuple[CostItem, CostItem, List[str]]:
        """
        Calculates destination customs duty and import taxes.
        - Uses structured tariff rules when country is recognized.
        - Clearly distinguishes customs duty vs import taxes.
        - If verified official tariff cannot be obtained, returns status='estimated' or 'unknown'.
        - Does not apply arbitrary percentages as official rates.
        """
        clean_country = destination_country.strip().lower()
        assumptions: List[str] = []

        if clean_country in ("india", "in"):
            # Indian Customs Tariff model for consumer goods & electronics:
            # CIF = Price + Shipping (if shipping unknown, estimated CIF basis used)
            shipping_val = shipping_item.amount if shipping_item.amount is not None else 0.0
            cif_val = product_price_converted + shipping_val

            # Basic Customs Duty (BCD) estimate ~10% for consumer electronics/appliances
            bcd_rate = 0.10
            bcd_amount = round(cif_val * bcd_rate, 2)
            # Social Welfare Surcharge (SWS): 10% on BCD
            sws_amount = round(bcd_amount * 0.10, 2)
            total_customs_duty = round(bcd_amount + sws_amount, 2)

            customs_item = CostItem(
                name="Customs Duty",
                amount=total_customs_duty,
                amount_source=round(total_customs_duty / exchange_rate, 2),
                currency=destination_currency,
                currency_source=source_currency,
                status="estimated",
                rate_or_detail="Estimated Indian BCD (~10%) + Social Welfare Surcharge (10% on BCD). Subject to Indian Customs classification.",
            )

            # Integrated Goods and Services Tax (IGST) ~18% on (CIF + Customs Duty)
            taxable_base = cif_val + total_customs_duty
            igst_rate = 0.18
            igst_amount = round(taxable_base * igst_rate, 2)

            tax_item = CostItem(
                name="Import Taxes (GST)",
                amount=igst_amount,
                amount_source=round(igst_amount / exchange_rate, 2),
                currency=destination_currency,
                currency_source=source_currency,
                status="estimated",
                rate_or_detail="Estimated IGST (~18%) on assessable value including customs duty.",
            )

            assumptions.append("Indian customs duty estimated under Chapter 85/consumer goods tariff heading.")
            assumptions.append("Final customs assessment at port of entry (ICEGATE) determines official payable duty.")
            return customs_item, tax_item, assumptions

        elif clean_country in ("united states", "usa", "us"):
            # US Section 321 de minimis threshold is $800
            # If under $800, generally duty-free for informal entries
            usd_amount = product_price_converted if destination_currency == "USD" else (product_price_source * 1.08)
            if usd_amount < 800.0:
                customs_item = CostItem(
                    name="Customs Duty",
                    amount=0.0,
                    amount_source=0.0,
                    currency=destination_currency,
                    currency_source=source_currency,
                    status="estimated",
                    rate_or_detail="US Section 321 De Minimis (Entries under $800 USD are generally duty-free).",
                )
                tax_item = CostItem(
                    name="Import Taxes",
                    amount=0.0,
                    amount_source=0.0,
                    currency=destination_currency,
                    currency_source=source_currency,
                    status="estimated",
                    rate_or_detail="No federal import VAT in the United States.",
                )
                assumptions.append("Eligible for US Section 321 duty exemption under $800 threshold.")
                return customs_item, tax_item, assumptions

        # Unknown / unconfigured destination country tariff
        customs_item = CostItem(
            name="Customs Duty",
            amount=None,
            amount_source=None,
            currency=destination_currency,
            currency_source=source_currency,
            status="unknown",
            rate_or_detail=f"Official customs tariff data not available for {destination_country}.",
        )
        tax_item = CostItem(
            name="Import Taxes",
            amount=None,
            amount_source=None,
            currency=destination_currency,
            currency_source=source_currency,
            status="unknown",
            rate_or_detail=f"Import tax rates unknown for {destination_country}.",
        )
        assumptions.append(f"Destination country {destination_country} has unknown tariff schedule.")
        return customs_item, tax_item, assumptions

    async def calculate_landed_cost(self, request: LandedCostRequest) -> LandedCostQuote:
        """
        Calculate transparent landed cost quote from trusted backend product details.
        Does NOT trust frontend prices.
        """
        # 1. Fetch product from trusted source
        # Channel3 products may be indexed under country/currency/language (DE, EUR, en),
        # under country/currency, currency only, or globally without regional query parameters.
        # Live Channel3 queries show that omitting language can cause HTTP 404 for DE/EUR,
        # which would fall back to an outlet/refurbished offer with different pricing.
        raw_detail = await self.c3_client.get_product(
            product_id=request.product_id,
            country="DE",
            currency="EUR",
            language="en",
        )
        if not raw_detail:
            raw_detail = await self.c3_client.get_product(
                product_id=request.product_id,
                country="DE",
                currency="EUR",
            )
        if not raw_detail:
            raw_detail = await self.c3_client.get_product(
                product_id=request.product_id,
                currency="EUR",
                language="en",
            )
        if not raw_detail:
            raw_detail = await self.c3_client.get_product(
                product_id=request.product_id,
                currency="EUR",
            )
        if not raw_detail:
            raw_detail = await self.c3_client.get_product(
                product_id=request.product_id,
            )

        if not raw_detail:
            raise ValueError(f"Product '{request.product_id}' not found in trusted catalog.")

        normalized_product = self.product_service.normalize_product(raw_detail)
        if not normalized_product.offers:
            raise ValueError(f"Product '{request.product_id}' currently has no verified retailer offers.")

        # Find selected offer or use best offer
        selected_offer = None
        if request.offer_url:
            for off in normalized_product.offers:
                if _matches_offer(off.url, request.offer_url):
                    selected_offer = off
                    break

        if not selected_offer:
            selected_offer = normalized_product.offers[0]

        source_price = selected_offer.price
        source_currency = selected_offer.currency
        target_currency = request.destination_currency.strip().upper()

        # 2. FX Conversion
        converted_price, fx_rate, rate_timestamp = await self.currency_service.get_conversion(
            amount=source_price,
            source_currency=source_currency,
            destination_currency=target_currency,
        )

        # 3. Shipping Calculation
        origin_country = "Germany"
        shipping_item = self.shipping_service.get_shipping_cost(
            origin_country=origin_country,
            destination_country=request.destination_country,
            source_currency=source_currency,
            destination_currency=target_currency,
            exchange_rate=fx_rate,
        )

        # 4. Customs & Taxes
        customs_item, tax_item, tariff_assumptions = self.calculate_customs_and_taxes(
            product_price_converted=converted_price,
            product_price_source=source_price,
            shipping_item=shipping_item,
            destination_country=request.destination_country,
            source_currency=source_currency,
            destination_currency=target_currency,
            exchange_rate=fx_rate,
        )

        # Assemble Line items
        product_item = CostItem(
            name="Product Base Price",
            amount=converted_price,
            amount_source=source_price,
            currency=target_currency,
            currency_source=source_currency,
            status="verified",
            rate_or_detail=f"Live retailer price from {selected_offer.domain or 'merchant'}",
        )

        breakdown = [product_item, shipping_item, customs_item, tax_item]

        # Calculate Total Cost
        # If shipping or duties are unknown, total cannot be claimed as exact
        has_unknown = any(item.status == "unknown" for item in breakdown)
        all_verified = all(item.status == "verified" for item in breakdown)

        total_cost: Optional[float] = None
        warnings: List[str] = []

        if not has_unknown:
            total_sum = sum(item.amount for item in breakdown if item.amount is not None)
            total_cost = round(total_sum, 2)
            if not all_verified:
                warnings.append("Total cost includes estimated logistics or customs charges; final invoice may vary slightly.")
        else:
            warnings.append("Total cost cannot be determined exactly because shipping or tariff data is unknown.")

        now = datetime.now(timezone.utc)
        expires = now + timedelta(minutes=DEFAULT_QUOTE_TTL_MINUTES)
        quote_id = f"qte_{uuid.uuid4().hex[:12]}"

        quote = LandedCostQuote(
            quote_id=quote_id,
            product_id=normalized_product.id,
            product_title=normalized_product.title,
            merchant=selected_offer.domain or selected_offer.merchant_name,
            merchant_url=selected_offer.url,
            source_currency=source_currency,
            destination_currency=target_currency,
            exchange_rate=fx_rate,
            rate_timestamp=rate_timestamp,
            product_price_source=source_price,
            product_price_converted=converted_price,
            breakdown=breakdown,
            total_estimated_cost=total_cost,
            total_is_exact=all_verified,
            created_at=now,
            expires_at=expires,
            assumptions=tariff_assumptions,
            warnings=warnings,
        )

        # Cache quote for Phase 5 checkout
        QUOTES_STORE[quote_id] = quote
        # Persist to database (best-effort, non-blocking on failure)
        await _persist_quote_to_db(quote)
        return quote

    async def get_quote(self, quote_id: str) -> Optional[LandedCostQuote]:
        """
        Retrieve a quote by ID, checking expiration.
        Checks in-memory cache first, then database.
        """
        # 1. Check in-memory cache
        quote = QUOTES_STORE.get(quote_id)
        if quote:
            now = datetime.now(timezone.utc)
            if now > quote.expires_at:
                logger.info("Quote %s has expired (memory).", quote_id)
                return None
            return quote

        # 2. Fall back to database
        try:
            from app.database.connection import AsyncSessionLocal
            if AsyncSessionLocal is None:
                return None
            from app.repositories.quote_repository import QuoteRepository
            async with AsyncSessionLocal() as session:
                repo = QuoteRepository(session)
                return await repo.get_valid(quote_id)  # returns None if expired
        except Exception as exc:
            logger.warning("DB quote lookup failed for %s: %s", quote_id, exc)
            return None


pricing_service = PricingService()

