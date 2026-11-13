from fastapi import APIRouter, HTTPException, status
from app.schemas.pricing_schema import LandedCostQuote, LandedCostRequest
from app.services.pricing_service import pricing_service

router = APIRouter()


@router.post(
    "/calculate",
    response_model=LandedCostQuote,
    status_code=status.HTTP_200_OK,
    summary="Calculate international landed cost and create purchase quote",
    description="Calculates FX conversion, estimated shipping, customs duties, and import taxes using trusted backend product offers."
)
async def calculate_landed_cost_endpoint(payload: LandedCostRequest) -> LandedCostQuote:
    """
    Generate transparent landed cost quote for an international product.
    Fetches the verified offer from trusted sources (does not trust frontend prices).
    """
    try:
        quote = await pricing_service.calculate_landed_cost(payload)
        return quote
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating landed cost: {str(exc)}"
        )


@router.get(
    "/quotes/{quote_id}",
    response_model=LandedCostQuote,
    status_code=status.HTTP_200_OK,
    summary="Retrieve active purchase quote",
    description="Retrieves a previously calculated server-side purchase quote before checkout."
)
async def get_quote_endpoint(quote_id: str) -> LandedCostQuote:
    """
    Retrieve active purchase quote by quote ID.
    Fails if the quote has expired or does not exist.
    """
    quote = await pricing_service.get_quote(quote_id)
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quote '{quote_id}' is either expired or not found."
        )
    return quote

