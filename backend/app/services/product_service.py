import asyncio
import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from app.integrations.channel3_client import (
    Channel3AuthError,
    Channel3Client,
    Channel3Error,
    Channel3RateLimitError,
    Channel3TimeoutError,
    Channel3ValidationError,
    channel3_client,
)
from app.schemas.chat import ShoppingRequirements
from app.schemas.product_schema import (
    NormalizedProduct,
    ProductImage,
    ProductOffer,
    ProductSearchMetadata,
    ProductSearchResponse,
)

logger = logging.getLogger("zen.services.product")

# Common international brands to detect from user preferences or product text
KNOWN_BRANDS = {
    "sony", "bose", "sennheiser", "apple", "samsung", "marshall", "jbl", "beats",
    "jlab", "audio-technica", "shure", "anker", "panasonic", "philips", "lg",
    "nikon", "canon", "dyson", "lego", "nintendo", "zara", "nike", "adidas",
    "puma", "uniqlo", "muji", "gucci", "prada", "rolex", "seiko", "casio"
}


def compute_relevance_score(product: NormalizedProduct, query_text: str) -> Tuple[int, float]:
    """
    Compute a structured product relevance score and category match flag.
    Returns:
        (category_match_tier, keyword_overlap_score)
        where:
          category_match_tier:
            2 = Exact/Strong Category & Model Match
            1 = Compatible / Neutral Match
            0 = Category Mismatch (e.g. user requested over-ear headphones, but product is earbuds)
    """
    if not query_text:
        return (1, 0.0)

    q_lower = query_text.lower()
    title_lower = (product.title or "").lower()

    # Category distinction: Earbuds vs Over-ear Headphones / Headsets
    earbud_keywords = {"earbud", "earbuds", "in-ear", "inear", "airpods", "earphones"}
    headphone_keywords = {"headphone", "headphones", "over-ear", "overear", "on-ear", "headset"}

    q_has_earbuds = any(re.search(rf"\b{k}\b", q_lower) for k in earbud_keywords)
    q_has_headphones = any(re.search(rf"\b{k}\b", q_lower) for k in headphone_keywords)

    t_has_earbuds = any(re.search(rf"\b{k}\b", title_lower) for k in earbud_keywords)
    t_has_headphones = any(re.search(rf"\b{k}\b", title_lower) for k in headphone_keywords)

    category_tier = 1
    # If user explicitly asked for headphones (not earbuds), but title is earbuds -> Category mismatch
    if q_has_headphones and not q_has_earbuds and t_has_earbuds and not t_has_headphones:
        category_tier = 0
    # If user explicitly asked for earbuds (not headphones), but title is over-ear headphones -> Category mismatch
    elif q_has_earbuds and not q_has_headphones and t_has_headphones and not t_has_earbuds:
        category_tier = 0
    elif (q_has_headphones and t_has_headphones) or (q_has_earbuds and t_has_earbuds):
        category_tier = 2

    # Keyword overlap scoring
    # Exclude common stopwords
    stopwords = {"and", "or", "the", "a", "an", "with", "for", "to", "in", "of", "from"}
    q_words = [w for w in re.findall(r"\b[a-zA-Z0-9_-]+\b", q_lower) if len(w) > 1 and w not in stopwords]
    t_words = set(re.findall(r"\b[a-zA-Z0-9_-]+\b", title_lower))

    if not q_words:
        return (category_tier, 0.0)

    matches = sum(1 for w in q_words if w in t_words)
    overlap = matches / len(q_words)

    # Boost tier if all significant words (e.g. "sennheiser", "accentum", "wireless", "headphones") match
    if category_tier > 0 and overlap >= 0.75:
        category_tier = 2

    return (category_tier, overlap)


class ProductService:
    """
    Service responsible for constructing Channel3 queries from ShoppingRequirements,
    calling Channel3, enriching offers via GET /v1/products/{id}, normalizing products,
    filtering/ranking by brand preferences, and calculating budget status strictly without fabricating prices.
    """

    def __init__(self, client: Optional[Channel3Client] = None):
        self.client = client or channel3_client

    def extract_brands(self, requirements: ShoppingRequirements) -> List[str]:
        """
        Extract brand names from product query and user preferences.
        """
        extracted: List[str] = []
        candidates: List[str] = []
        if requirements.preferences:
            candidates.extend(requirements.preferences)
        if requirements.product:
            candidates.extend(requirements.product.split())

        for c in candidates:
            clean = c.strip().lower()
            if clean in KNOWN_BRANDS and clean not in [e.lower() for e in extracted]:
                extracted.append(c.strip())

        return extracted

    def build_search_query(self, requirements: ShoppingRequirements) -> str:
        """
        Construct a targeted search query from product, preferences, and origin country.
        """
        parts: List[str] = []
        if requirements.product:
            parts.append(requirements.product.strip())

        if requirements.preferences:
            clean_prefs = [p.strip() for p in requirements.preferences if p.strip()]
            for p in clean_prefs:
                if p.lower() not in (requirements.product or "").lower():
                    parts.append(p)

        if requirements.origin_country:
            parts.append(f"from {requirements.origin_country.strip()}")

        query = " ".join(parts).strip()
        return query or "product"

    def normalize_offer(self, off: Dict[str, Any]) -> Optional[ProductOffer]:
        """
        Safely extract and normalize an individual offer.
        Supports both:
          - Scalar price: {"price": 279.9, "currency": "EUR"}
          - Nested price: {"price": {"price": 279.9, "compare_at_price": None, "currency": "EUR"}}
        Returns None if price or currency is missing/invalid. Never converts missing prices to 0.
        """
        if not isinstance(off, dict):
            return None

        price_val: Optional[float] = None
        compare_at_val: Optional[float] = None
        currency_val: Optional[str] = None

        raw_price_field = off.get("price")

        # 1. Nested price object format
        if isinstance(raw_price_field, dict):
            raw_p = raw_price_field.get("price")
            if raw_p is not None:
                try:
                    price_val = float(raw_p)
                except (ValueError, TypeError):
                    price_val = None

            raw_cap = raw_price_field.get("compare_at_price")
            if raw_cap is not None:
                try:
                    compare_at_val = float(raw_cap)
                except (ValueError, TypeError):
                    compare_at_val = None

            raw_curr = raw_price_field.get("currency") or off.get("currency")
            if raw_curr and isinstance(raw_curr, str) and raw_curr.strip():
                currency_val = raw_curr.strip().upper()

        # 2. Scalar price format
        else:
            raw_p = off.get("current_price") if off.get("current_price") is not None else raw_price_field
            if raw_p is not None:
                try:
                    price_val = float(raw_p)
                except (ValueError, TypeError):
                    price_val = None

            raw_cap = off.get("original_price") or off.get("compare_at_price")
            if raw_cap is not None:
                try:
                    compare_at_val = float(raw_cap)
                except (ValueError, TypeError):
                    compare_at_val = None

            raw_curr = off.get("currency")
            if raw_curr and isinstance(raw_curr, str) and raw_curr.strip():
                currency_val = raw_curr.strip().upper()

        # Validation: Price and currency must both be present and valid
        if price_val is None or not currency_val:
            return None

        domain = off.get("domain") or None
        # Preserve merchant_name if explicitly provided; do not invent
        merchant_name = off.get("merchant_name") or off.get("merchant") or None

        return ProductOffer(
            url=off.get("url"),
            domain=domain,
            merchant_name=merchant_name,
            price=price_val,
            compare_at_price=compare_at_val,
            currency=currency_val,
            availability=str(off.get("availability") or "unknown"),
            condition=str(off.get("condition") or "new"),
        )

    def normalize_product(self, raw_prod: Dict[str, Any]) -> NormalizedProduct:
        """
        Safely transform a raw Channel3 Product into Zen's NormalizedProduct schema.
        Handles missing fields safely and sets unverified cross-border shipping fields to 'unknown' / None.
        """
        prod_id = str(raw_prod.get("id") or "")
        title = raw_prod.get("title") or "Unnamed Product"
        description = raw_prod.get("description")

        # Brand extraction
        brand_name = None
        raw_brands = raw_prod.get("brands")
        if isinstance(raw_brands, list) and len(raw_brands) > 0:
            first_brand = raw_brands[0]
            if isinstance(first_brand, dict):
                brand_name = first_brand.get("name")
            elif isinstance(first_brand, str):
                brand_name = first_brand
        elif isinstance(raw_prod.get("brand"), str):
            brand_name = raw_prod.get("brand")

        # Images extraction
        images: List[ProductImage] = []
        main_image_url: Optional[str] = None
        raw_images = raw_prod.get("images") or []
        if isinstance(raw_images, list):
            for img in raw_images:
                if isinstance(img, dict) and img.get("url"):
                    is_main = bool(img.get("is_main_image", False))
                    p_img = ProductImage(
                        url=img["url"],
                        cleaned_url=img.get("cleaned_url"),
                        is_main_image=is_main,
                        alt_text=img.get("alt_text"),
                    )
                    images.append(p_img)
                    if is_main and not main_image_url:
                        main_image_url = p_img.cleaned_url or p_img.url
            if not main_image_url and images:
                main_image_url = images[0].cleaned_url or images[0].url

        # Offers extraction
        offers: List[ProductOffer] = []
        raw_offers = raw_prod.get("offers") or []
        if isinstance(raw_offers, list):
            for off in raw_offers:
                try:
                    normalized_off = self.normalize_offer(off)
                    if normalized_off:
                        offers.append(normalized_off)
                except Exception as off_err:
                    logger.warning("Error normalizing offer for product %s: %s", prod_id, off_err)

        # Primary offer details: Select best valid offer (lowest price)
        primary_price: Optional[float] = None
        primary_currency: Optional[str] = None
        primary_merchant: Optional[str] = None
        primary_url: Optional[str] = None

        if offers:
            # Sort offers with valid price ascending
            valid_offers = sorted(offers, key=lambda o: o.price)
            best_offer = valid_offers[0]
            primary_price = best_offer.price
            primary_currency = best_offer.currency
            primary_merchant = best_offer.domain or best_offer.merchant_name
            primary_url = best_offer.url

        return NormalizedProduct(
            id=prod_id,
            title=title,
            description=description,
            brand=brand_name,
            images=images,
            main_image_url=main_image_url,
            price=primary_price,
            currency=primary_currency,
            merchant=primary_merchant,
            merchant_url=primary_url,
            offers=offers,
            # Critical Safety: Never invent international shipping
            shipping_status="unknown",
            delivery_estimate=None,
        )

    async def _enrich_product_offers(
        self,
        products: List[Dict[str, Any]],
        country: str = "DE",
        currency: str = "EUR",
        language: str = "en",
        max_enrich: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Enrich products with live offers using GET /v1/products/{id} if offers are missing.
        """
        enriched_list: List[Dict[str, Any]] = []

        async def fetch_one(prod: Dict[str, Any]) -> Dict[str, Any]:
            prod_offers = prod.get("offers")
            # If search response already has offers with price, return immediately
            if isinstance(prod_offers, list) and len(prod_offers) > 0:
                has_any_price = any(
                    isinstance(o, dict) and (o.get("price") is not None or o.get("current_price") is not None)
                    for o in prod_offers
                )
                if has_any_price:
                    return prod

            prod_id = prod.get("id")
            if not prod_id:
                return prod

            try:
                details = await self.client.get_product(
                    product_id=prod_id,
                    country=country,
                    currency=currency,
                    language=language,
                )
                if not details:
                    details = await self.client.get_product(
                        product_id=prod_id,
                        country=country,
                        currency=currency,
                    )
                if not details:
                    details = await self.client.get_product(
                        product_id=prod_id,
                        currency=currency,
                        language=language,
                    )
                if not details:
                    details = await self.client.get_product(
                        product_id=prod_id,
                        currency=currency,
                    )
                if not details:
                    details = await self.client.get_product(
                        product_id=prod_id,
                    )
                if details and isinstance(details.get("offers"), list) and len(details["offers"]) > 0:
                    merged = dict(prod)
                    merged["offers"] = details["offers"]
                    return merged
            except Exception as e:
                logger.warning("Enrichment failed for product %s: %s", prod_id, e)

            return prod

        tasks = [fetch_one(p) for p in products[:max_enrich]]
        enriched_subset = await asyncio.gather(*tasks, return_exceptions=True)

        for i, item in enumerate(products):
            if i < max_enrich and not isinstance(enriched_subset[i], Exception):
                enriched_list.append(enriched_subset[i])
            else:
                enriched_list.append(item)

        return enriched_list

    def filter_and_rank_by_brand(
        self,
        products: List[NormalizedProduct],
        preferred_brands: List[str],
    ) -> Tuple[List[NormalizedProduct], List[NormalizedProduct], bool]:
        """
        Partition products into matching brand products and alternatives.
        Never describe an alternative as a preferred brand match.
        """
        if not preferred_brands:
            return products, [], True

        preferred_lower = {b.lower() for b in preferred_brands}
        exact_matches: List[NormalizedProduct] = []
        alternatives: List[NormalizedProduct] = []

        for p in products:
            p_brand = (p.brand or "").lower()
            p_title = (p.title or "").lower()

            is_match = any(
                b in p_brand or b in p_title.split() or f" {b} " in f" {p_title} "
                for b in preferred_lower
            )

            if is_match:
                exact_matches.append(p)
            else:
                alternatives.append(p)

        has_exact = len(exact_matches) > 0
        return exact_matches, alternatives, has_exact

    async def search_products(
        self,
        requirements: ShoppingRequirements,
        limit: int = 10,
    ) -> ProductSearchResponse:
        """
        Execute product search via Channel3 given user shopping requirements.
        - German storefront (EUR) searched via config locale overrides.
        - Enriches offer data when missing via GET /v1/products/{id}.
        - Brand matching partitions exact matches from alternatives.
        - Budget filter applied strictly only when valid prices with matching currency exist.
        """
        query = self.build_search_query(requirements)
        preferred_brands = self.extract_brands(requirements)

        # Build config for German-market offers
        search_country = "DE"
        search_currency = "EUR"
        search_language = "en"
        config: Dict[str, Any] = {
            "country": search_country,
            "currency": search_currency,
            "language": search_language,
        }

        dest_country = requirements.destination.country if requirements.destination else None

        metadata = ProductSearchMetadata(
            query=query,
            locale=search_country.lower(),
            currency=search_currency,
            destination_country=dest_country,
            budget_applied=False,
            budget_note=None,
            total_results=0,
            preferred_brands=preferred_brands,
            has_exact_brand_match=True,
        )

        try:
            raw_response = await self.client.search(
                query=query,
                filters=None,  # Do not pre-filter on server before offer inspection
                config=config,
                limit=limit,
            )
        except (Channel3AuthError, Channel3ValidationError, Channel3RateLimitError, Channel3TimeoutError, Channel3Error) as exc:
            logger.error("Channel3 search failed: %s", exc)
            return ProductSearchResponse(
                products=[],
                alternative_products=[],
                metadata=metadata,
                status="error",
                message=str(exc),
            )

        raw_products = raw_response.get("products", [])

        # Enrich missing offers via documented GET /v1/products/{id}
        enriched_products = await self._enrich_product_offers(
            products=raw_products,
            country=search_country,
            currency=search_currency,
        )

        normalized_all: List[NormalizedProduct] = []
        for p in enriched_products:
            try:
                norm_p = self.normalize_product(p)
                normalized_all.append(norm_p)
            except Exception as parse_err:
                logger.warning("Error normalizing product item: %s", parse_err)

        # Brand preference matching & separation
        matching_products, alt_products, has_exact_brand = self.filter_and_rank_by_brand(
            normalized_all,
            preferred_brands,
        )
        metadata.has_exact_brand_match = has_exact_brand

        # Budget verification: Only apply budget if actual numeric prices in matching currency are present
        user_budget = requirements.budget
        target_list = matching_products if has_exact_brand else alt_products
        final_products: List[NormalizedProduct] = []

        if user_budget and user_budget.amount is not None:
            if user_budget.currency == search_currency:
                # Check if products have verified prices
                priced_products = [p for p in target_list if p.price is not None]
                unpriced_products = [p for p in target_list if p.price is None]

                if priced_products:
                    # Filter only products with verified prices under budget
                    budget_filtered = [p for p in priced_products if p.price <= user_budget.amount]
                    final_products = budget_filtered + unpriced_products
                    metadata.budget_applied = True
                    metadata.budget_note = (
                        f"Filtered product offers under {user_budget.amount} {search_currency} (base product price). "
                        f"Found {len(budget_filtered)} verified in-budget offer(s). "
                        f"International shipping, customs, and taxes are estimated additionally at quote time."
                    )
                else:
                    final_products = target_list
                    metadata.budget_applied = False
                    metadata.budget_note = (
                        f"Product prices are currently pending or unverified. "
                        f"Budget filter of {user_budget.amount} {search_currency} was not applied."
                    )
            else:
                final_products = target_list
                metadata.budget_applied = False
                metadata.budget_note = (
                    f"User budget is in {user_budget.currency or 'unspecified'}, while storefront offers are in "
                    f"{search_currency}. Budget filter not applied to avoid misfiltering before currency conversion."
                )
        else:
            final_products = target_list
            metadata.budget_applied = False
            metadata.budget_note = "No budget specified."

        # Rank candidates using category and keyword relevance first
        req_query_text = (requirements.product or query).strip()
        final_products.sort(
            key=lambda p: compute_relevance_score(p, req_query_text),
            reverse=True,
        )
        if alt_products:
            alt_products.sort(
                key=lambda p: compute_relevance_score(p, req_query_text),
                reverse=True,
            )

        metadata.total_results = len(final_products)

        # Generate human-readable summary
        if preferred_brands and not has_exact_brand:
            summary_msg = (
                f"No exact matches found for brand(s): {', '.join(preferred_brands)}. "
                f"Displaying {len(alt_products)} alternative option(s) matching '{query}' from German merchant offers."
            )
        else:
            summary_msg = (
                f"Found {len(final_products)} products matching '{query}' from German merchant offers. "
                "International shipping and customs to destination will be verified in subsequent steps."
            )

        return ProductSearchResponse(
            products=final_products,
            alternative_products=alt_products if has_exact_brand else [],
            metadata=metadata,
            status="success",
            message=summary_msg,
        )


product_service = ProductService()
