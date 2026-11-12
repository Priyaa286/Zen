from fastapi import APIRouter, HTTPException, status
from app.schemas.chat import ShoppingRequirements
from app.schemas.product_schema import ProductSearchResponse
from app.services.product_service import product_service

router = APIRouter()


@router.post(
    "/search",
    response_model=ProductSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search international products via Channel3",
    description="Discovers international products using structured ShoppingRequirements. Results include merchants, prices, and unverified shipping flags."
)
async def search_products_endpoint(payload: ShoppingRequirements) -> ProductSearchResponse:
    """
    Search products based on parsed user shopping requirements.
    Normalizes Channel3 catalog data and guarantees that international shipping is not hallucinated.
    """
    response = await product_service.search_products(payload)
    if response.status == "error":
        # Keep client response descriptive according to standard conventions
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Product discovery service error: {response.message}"
        )
    return response

