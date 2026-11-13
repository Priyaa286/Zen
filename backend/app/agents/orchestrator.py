"""
AI Shopping Agent Orchestrator — Phase 6-8.

Workflow:
  1. Extract shopping requirements from NL (ShoppingAgent / Ollama)
  2. Search products via Channel3 (ProductService)
  3. Calculate landed-cost quotes for top products (PricingService)
  4. Rank by total estimated cost (Phase 7)
  5. Return structured results with transparency flags
  6. On explicit buyer approval (approve_quote_id), create a PayPal order (Phase 8)

Financial safety:
  - Prices are NEVER accepted from the client.
  - Payable amount is always derived from a server-side quote.
  - Estimated shipping/customs are flagged and never silently charged.
  - Buyer must explicitly approve a quote_id before checkout.
"""

from __future__ import annotations

import asyncio
import logging
from typing import List, Optional, Tuple

from app.agents.shopping_agent import ShoppingAgent, shopping_agent
from app.schemas.agent_schema import (
    BudgetStatus,
    CheckoutResult,
    RankedProduct,
    ShopRequest,
    ShopResponse,
)
from app.schemas.chat import ShoppingRequirements
from app.schemas.checkout_schema import CreateOrderRequest
from app.schemas.pricing_schema import LandedCostQuote, LandedCostRequest
from app.schemas.product_schema import NormalizedProduct
from app.services.payment_service import PaymentError, PaymentService, payment_service
from app.services.pricing_service import PricingService, pricing_service
from app.services.product_service import ProductService, compute_relevance_score, product_service

logger = logging.getLogger("zen.agents.orchestrator")

MAX_QUOTED_PRODUCTS = 3


class ShoppingOrchestrator:
    """Coordinates the full AI shopping workflow from NL request to PayPal checkout."""

    def __init__(
        self,
        agent: Optional[ShoppingAgent] = None,
        prod_service: Optional[ProductService] = None,
        price_service: Optional[PricingService] = None,
        pay_service: Optional[PaymentService] = None,
    ):
        self.agent = agent or shopping_agent
        self.product_service = prod_service or product_service
        self.pricing_service = price_service or pricing_service
        self.payment_service = pay_service or payment_service

    async def handle(self, req: ShopRequest) -> ShopResponse:
        if req.approve_quote_id:
            return await self._handle_checkout(req)
        return await self._handle_discovery(req)

    # ------------------------------------------------------------------
    # Discovery flow
    # ------------------------------------------------------------------

    async def _handle_discovery(self, req: ShopRequest) -> ShopResponse:
        # Step 1: NL extraction
        chat_response = await self.agent.process_message(req.message)

        if chat_response.status == "error":
            return ShopResponse(
                status="error",
                message=chat_response.message,
                missing_information=chat_response.missing_information,
            )

        requirements: Optional[ShoppingRequirements] = chat_response.requirements
        missing = chat_response.missing_information

        if missing and not requirements:
            return ShopResponse(
                status="needs_info",
                message=chat_response.message,
                requirements=requirements,
                missing_information=missing,
            )

        warnings: List[str] = []
        if missing:
            warnings.append(
                f"Some details not found ({', '.join(missing)}). Results may be less targeted."
            )

        # Step 2: Product search
        search_response = await self.product_service.search_products(requirements, limit=10)

        if search_response.status == "error":
            return ShopResponse(
                status="error",
                message=f"Product search failed: {search_response.message}",
                requirements=requirements,
                missing_information=missing,
                warnings=warnings,
            )

        all_primary = search_response.products
        all_alternative = search_response.alternative_products
        query_used = search_response.metadata.query

        if not all_primary and not all_alternative:
            return ShopResponse(
                status="results",
                message=f"No products found for '{query_used}'. Try a broader search term.",
                requirements=requirements,
                missing_information=missing,
                search_query_used=query_used,
                warnings=warnings,
            )

        # Step 3 & 4: Quote + rank
        dest_country = req.destination_country
        dest_currency = req.destination_currency
        req_product_text = (requirements.product or query_used).strip() if requirements else query_used

        ranked_primary, q_warnings = await self._quote_and_rank(
            all_primary[:MAX_QUOTED_PRODUCTS],
            dest_country,
            dest_currency,
            target_product_query=req_product_text,
        )
        ranked_alternatives, _ = await self._quote_and_rank(
            all_alternative[:MAX_QUOTED_PRODUCTS],
            dest_country,
            dest_currency,
            target_product_query=req_product_text,
        )

        warnings.extend(q_warnings)
        if search_response.metadata.budget_note:
            warnings.append(search_response.metadata.budget_note)

        total_found = len(all_primary) + len(all_alternative)

        # Budget interpretation & transparency distinction
        budget_status = self._evaluate_budget_status(
            requirements=requirements,
            ranked_products=ranked_primary or ranked_alternatives,
            destination_currency=dest_currency,
        )
        if budget_status and budget_status.explanation:
            warnings.append(budget_status.explanation)

        # Summary
        if ranked_primary:
            top = ranked_primary[0]
            if top.quote and top.quote.total_estimated_cost:
                cost_str = f"{top.quote.total_estimated_cost:.0f} {dest_currency}"
                exact_flag = " (all costs verified)" if top.quote.total_is_exact else " (includes estimates)"
                summary = (
                    f"Found {len(all_primary)} product(s). "
                    f"Top pick: '{top.product.title}' — est. total {cost_str}{exact_flag}. "
                    "Approve a quote_id to proceed to checkout."
                )
            else:
                summary = (
                    f"Found {len(all_primary)} product(s). "
                    "Landed costs shown per item. Approve a quote_id to proceed."
                )
        elif ranked_alternatives:
            summary = (
                f"No exact brand matches. Showing {len(all_alternative)} alternative(s). "
                "Approve a quote_id to proceed."
            )
        else:
            summary = "Products found but quotes could not be calculated."

        return ShopResponse(
            status="results",
            message=summary,
            requirements=requirements,
            missing_information=missing,
            products=ranked_primary,
            alternative_products=ranked_alternatives,
            total_products_found=total_found,
            budget_status=budget_status,
            search_query_used=query_used,
            warnings=warnings,
        )

    def _evaluate_budget_status(
        self,
        requirements: Optional[ShoppingRequirements],
        ranked_products: List[RankedProduct],
        destination_currency: str,
    ) -> Optional[BudgetStatus]:
        """
        Distinguishes product-price budget from landed-cost budget.
        Discloses that shipping and import estimates are additional.
        Never claims total landed cost is within budget if it exceeds it.
        """
        if not requirements or not requirements.budget or requirements.budget.amount is None:
            return None

        budget = requirements.budget
        b_amount = budget.amount
        b_curr = (budget.currency or destination_currency).upper()

        if not ranked_products or not ranked_products[0].quote:
            return BudgetStatus(
                budget_amount=b_amount,
                budget_currency=b_curr,
                product_price_in_budget=None,
                landed_cost_in_budget=None,
                explanation=f"Budget cap: {b_amount:.2f} {b_curr}. Quotes pending.",
            )

        top_quote = ranked_products[0].quote
        # Compare in matching currency
        prod_price: Optional[float] = None
        landed_price: Optional[float] = top_quote.total_estimated_cost

        if b_curr == top_quote.destination_currency:
            prod_price = top_quote.product_price_converted
            landed_price = top_quote.total_estimated_cost
        elif b_curr == top_quote.source_currency:
            prod_price = top_quote.product_price_source
            # If landed total is in destination currency, convert back for comparison
            if top_quote.total_estimated_cost and top_quote.exchange_rate > 0:
                landed_price = round(top_quote.total_estimated_cost / top_quote.exchange_rate, 2)

        prod_in_budget = (prod_price <= b_amount) if prod_price is not None else None
        landed_in_budget = (landed_price <= b_amount) if landed_price is not None else None

        explanation_parts = []
        if prod_in_budget is True and landed_in_budget is False:
            explanation_parts.append(
                f"Product base price ({prod_price:.2f} {b_curr}) is within your stated budget ({b_amount:.2f} {b_curr}). "
                f"However, estimated total landed cost ({landed_price:.2f} {b_curr}) exceeds your budget due to international shipping and import duties."
            )
        elif prod_in_budget is True and landed_in_budget is True:
            explanation_parts.append(
                f"Both product base price ({prod_price:.2f} {b_curr}) and estimated landed cost ({landed_price:.2f} {b_curr}) are within your budget ({b_amount:.2f} {b_curr})."
            )
        elif prod_in_budget is False:
            explanation_parts.append(
                f"Product base price ({prod_price:.2f} {b_curr}) exceeds your stated budget ({b_amount:.2f} {b_curr})."
            )
        else:
            explanation_parts.append(
                f"Budget cap: {b_amount:.2f} {b_curr}. Shipping and import fees are estimated additionally."
            )

        return BudgetStatus(
            budget_amount=b_amount,
            budget_currency=b_curr,
            product_price_in_budget=prod_in_budget,
            landed_cost_in_budget=landed_in_budget,
            explanation=" ".join(explanation_parts),
        )

    # ------------------------------------------------------------------
    # Checkout flow
    # ------------------------------------------------------------------

    async def _handle_checkout(self, req: ShopRequest) -> ShopResponse:
        quote_id = req.approve_quote_id

        if not req.return_url or not req.cancel_url:
            return ShopResponse(
                status="error",
                message="return_url and cancel_url are required when approving a quote.",
            )

        for field, url in [("return_url", req.return_url), ("cancel_url", req.cancel_url)]:
            if not url.startswith(("http://", "https://")):
                return ShopResponse(status="error", message=f"{field} must be http(s).")

        quote = await self.pricing_service.get_quote(quote_id)
        if not quote:
            return ShopResponse(
                status="error",
                message=f"Quote '{quote_id}' is expired or not found. Please search again.",
            )

        try:
            order_resp = await self.payment_service.create_order(
                CreateOrderRequest(
                    quote_id=quote_id,
                    return_url=req.return_url,
                    cancel_url=req.cancel_url,
                )
            )
        except PaymentError as exc:
            err_msg = getattr(exc, "message", str(exc))
            err_code = getattr(exc, "error_code", None) or "PAYPAL_CREATION_FAILED"
            return ShopResponse(
                status="error",
                message=f"PayPal order creation failed ({err_code}): {err_msg}",
            )
        except Exception as exc:
            logger.exception("Unexpected error creating PayPal order: %s", exc)
            return ShopResponse(
                status="error",
                message="Unexpected error initiating checkout.",
            )

        transaction_currency = order_resp.currency or quote.source_currency or "EUR"
        transaction_amount = order_resp.payable_amount if order_resp.payable_amount is not None else quote.product_price_source
        dest_currency = quote.destination_currency.upper()
        est_landed_total = quote.total_estimated_cost or quote.product_price_converted

        safety_note = (
            f"PayPal charge is for the merchant product price ({transaction_amount:.2f} {transaction_currency}). "
            f"Your estimated landed cost in {dest_currency} is {est_landed_total:.2f} {dest_currency}. "
            "International shipping and customs duties are logistics estimates, not included in this PayPal charge, and may be collected separately at delivery."
        )

        checkout = CheckoutResult(
            paypal_order_id=order_resp.paypal_order_id,
            approval_url=order_resp.approval_url,
            payable_amount=round(transaction_amount, 2),
            currency=transaction_currency,
            quote_id=quote_id,
            status=order_resp.status,
            safety_note=safety_note,
            destination_currency=dest_currency,
            estimated_landed_cost=round(est_landed_total, 2),
        )

        return ShopResponse(
            status="checkout",
            message=(
                f"PayPal order created. Complete payment at the approval URL. "
                f"Payable to merchant: {checkout.payable_amount:.2f} {checkout.currency} "
                f"(Customer estimated landed total: {est_landed_total:.2f} {dest_currency})."
            ),
            checkout=checkout,
        )

    # ------------------------------------------------------------------
    # Quote & rank
    # ------------------------------------------------------------------

    async def _quote_and_rank(
        self,
        products: List[NormalizedProduct],
        destination_country: str,
        destination_currency: str,
        target_product_query: Optional[str] = None,
    ) -> Tuple[List[RankedProduct], List[str]]:
        warnings: List[str] = []

        async def quote_one(
            product: NormalizedProduct,
        ) -> Tuple[NormalizedProduct, Optional[LandedCostQuote], Optional[str]]:
            if not product.id:
                return product, None, "Product has no ID"
            try:
                quote = await self.pricing_service.calculate_landed_cost(
                    LandedCostRequest(
                        product_id=product.id,
                        offer_url=product.merchant_url,
                        destination_country=destination_country,
                        destination_currency=destination_currency,
                    )
                )
                return product, quote, None
            except ValueError as exc:
                return product, None, str(exc)
            except Exception as exc:
                logger.warning("Quote failed for %s: %s", product.id, exc)
                return product, None, f"Quote unavailable: {exc}"

        results = await asyncio.gather(*[quote_one(p) for p in products], return_exceptions=True)

        quoted: List[Tuple[NormalizedProduct, Optional[LandedCostQuote], Optional[str]]] = []
        for r in results:
            if isinstance(r, Exception):
                warnings.append(f"Quote error: {r}")
            else:
                quoted.append(r)

        for _, q, err in quoted:
            if err and not q:
                warnings.append(err)

        # Sort:
        # Prioritize exact product matches and category relevance over price!
        # Category tier: 2 (exact model/category match) > 1 (compatible/neutral) > 0 (category mismatch)
        # Keyword overlap: higher is better
        # Then by total_estimated_cost asc
        def sort_key(item: Tuple) -> Tuple[int, float, int, float]:
            prod, q, _ = item
            tier, overlap = compute_relevance_score(prod, target_product_query or "")
            cost_priority = 0 if q is not None and (q.total_estimated_cost is not None or q.product_price_converted) else 1
            cost = q.total_estimated_cost if (q and q.total_estimated_cost is not None) else (q.product_price_converted if q else float("inf"))

            # Return tuple to sort by:
            # - tier descending (-tier)
            # - keyword overlap descending (-overlap)
            # - cost_priority ascending
            # - cost ascending
            return (-tier, -round(overlap, 2), cost_priority, cost)

        quoted.sort(key=sort_key)

        ranked: List[RankedProduct] = []
        for idx, (product, quote, err) in enumerate(quoted, start=1):
            # Guarantee price & merchant consistency: if a live quote was calculated,
            # sync product price, currency, merchant, and merchant_url to the verified quote
            if quote:
                product.price = quote.product_price_source
                product.currency = quote.source_currency
                product.merchant = quote.merchant
                product.merchant_url = quote.merchant_url

            ranked.append(
                RankedProduct(
                    rank=idx,
                    product=product,
                    quote=quote,
                    quote_error=err,
                    is_recommended=(idx == 1 and quote is not None),
                    ranking_note=self._ranking_note(product, quote, idx, target_product_query),
                )
            )

        return ranked, warnings

    def _ranking_note(
        self,
        product: NormalizedProduct,
        quote: Optional[LandedCostQuote],
        rank: int,
        target_product_query: Optional[str] = None,
    ) -> str:
        if quote is None:
            return "Quote unavailable — cannot rank by total cost."
        total = quote.total_estimated_cost
        currency = quote.destination_currency

        tier, _ = compute_relevance_score(product, target_product_query or "")
        match_prefix = ""
        if tier == 2:
            match_prefix = "Exact product match. "
        elif tier == 0:
            match_prefix = "Related item (different category). "

        if rank == 1:
            if quote.total_is_exact:
                return f"{match_prefix}Lowest verified total cost: {total:.0f} {currency}."
            return f"{match_prefix}Lowest estimated total: {total:.0f} {currency} (includes estimated shipping/duties)." if total else f"{match_prefix}Best available option."
        return f"{match_prefix}Estimated total: {total:.0f} {currency}." if total else f"{match_prefix}Price available; total cost pending."


shopping_orchestrator = ShoppingOrchestrator()

