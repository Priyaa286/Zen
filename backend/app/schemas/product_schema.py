from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ProductBrand(BaseModel):
    """
    Brand details for a product.
    """
    id: Optional[str] = Field(default=None, description="Brand identifier")
    name: str = Field(..., description="Brand name")


class ProductImage(BaseModel):
    """
    Product image metadata.
    """
    url: str = Field(..., description="Original image URL")
    cleaned_url: Optional[str] = Field(default=None, description="Cleaned square image on CDN")
    is_main_image: bool = Field(default=False, description="Whether this is the primary image")
    alt_text: Optional[str] = Field(default=None, description="Accessibility alt text")


class ProductOffer(BaseModel):
    """
    Merchant offer listing for the product.
    """
    url: Optional[str] = Field(default=None, description="Direct merchant store/buy link")
    domain: Optional[str] = Field(default=None, description="Merchant store domain, e.g. amazon.de, zara.com")
    merchant_name: Optional[str] = Field(default=None, description="Human readable merchant name if provided")
    price: float = Field(..., description="Current price in the offer currency")
    compare_at_price: Optional[float] = Field(default=None, description="Original or compare-at price before discount")
    currency: str = Field(..., description="ISO-4217 offer currency code")
    availability: str = Field(default="unknown", description="Offer stock status e.g. InStock, OutOfStock")
    condition: Optional[str] = Field(default="new", description="Item condition e.g. new, used, refurbished")


class NormalizedProduct(BaseModel):
    """
    Normalized product result in Zen's unified format.
    """
    id: str = Field(..., description="Canonical product ID")
    title: str = Field(..., description="Product title / name")
    description: Optional[str] = Field(default=None, description="Product description")
    brand: Optional[str] = Field(default=None, description="Primary brand name")
    images: List[ProductImage] = Field(default_factory=list, description="Product images")
    main_image_url: Optional[str] = Field(default=None, description="Primary image URL for display")
    price: Optional[float] = Field(default=None, description="Best/current offer price")
    currency: Optional[str] = Field(default=None, description="Currency of the current offer")
    merchant: Optional[str] = Field(default=None, description="Merchant domain / name")
    merchant_url: Optional[str] = Field(default=None, description="Direct product buy/store link")
    offers: List[ProductOffer] = Field(default_factory=list, description="All valid retailer offers")
    
    # Critical Cross-Border Safety Fields (never fabricated)
    shipping_status: str = Field(
        default="unknown",
        description="International shipping status: 'unknown' unless verified by carrier/merchant"
    )
    delivery_estimate: Optional[str] = Field(
        default=None,
        description="Delivery timeline estimate: null unless verified by carrier/merchant"
    )


class ProductSearchMetadata(BaseModel):
    """
    Metadata about the product search execution.
    """
    query: str = Field(..., description="Constructed search query used for discovery")
    locale: str = Field(default="de", description="Storefront locale searched")
    currency: str = Field(default="EUR", description="Storefront currency searched")
    destination_country: Optional[str] = Field(default=None, description="User's destination country")
    budget_applied: bool = Field(default=False, description="Whether user budget filter was applied")
    budget_note: Optional[str] = Field(default=None, description="Information about budget/currency comparison")
    total_results: int = Field(default=0, description="Number of products returned")
    
    # Brand matching metadata
    preferred_brands: List[str] = Field(default_factory=list, description="User's preferred brands extracted")
    has_exact_brand_match: bool = Field(default=True, description="Whether results contain exact preferred brand matches")


class ProductSearchResponse(BaseModel):
    """
    Response schema for POST /api/v1/products/search.
    """
    products: List[NormalizedProduct] = Field(default_factory=list, description="Normalized matching products")
    alternative_products: List[NormalizedProduct] = Field(default_factory=list, description="Alternative brand products if preferred brand has no matches or few matches")
    metadata: ProductSearchMetadata = Field(..., description="Search metadata and parameters")
    status: str = Field(default="success", description="Status: success, partial, or error")
    message: str = Field(default="", description="Human readable summary of search results")
