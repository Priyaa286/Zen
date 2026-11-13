import { ProductImage } from '@/components/common/ProductImage';
import { cn } from '@/utils/cn';

export function ProductGallery({
  images = [],
  activeImage,
  selectedImageIdx = 0,
  onSelectImage,
  productTitle,
  category,
}) {
  return (
    <div className="lg:col-span-6 space-y-3">
      <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F1F3F6]">
        <ProductImage
          src={activeImage}
          alt={`${productTitle} - Primary view`}
          category={category}
          className="aspect-[4/3] w-full"
          loading="eager"
          fetchPriority="high"
          width={600}
          height={450}
        />
      </div>

      {images.length > 1 ? (
        <div
          role="region"
          aria-label="Product thumbnails"
          className="flex items-center gap-2 overflow-x-auto pb-1"
        >
          {images.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectImage(idx)}
              aria-label={`View photo ${idx + 1} of ${productTitle}`}
              aria-pressed={selectedImageIdx === idx}
              className={cn(
                'h-16 w-20 shrink-0 overflow-hidden rounded border bg-[#F1F3F6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#465BE5]',
                selectedImageIdx === idx
                  ? 'border-[#172554] ring-1 ring-[#172554]/20'
                  : 'border-[#E5E7EB] hover:border-[#CBD5E1]'
              )}
            >
              <ProductImage
                src={src}
                alt={`${productTitle} thumbnail ${idx + 1}`}
                category={category}
                className="h-full w-full"
                loading="lazy"
                width={80}
                height={64}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default ProductGallery;
