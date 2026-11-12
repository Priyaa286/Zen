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
          alt={productTitle}
          category={category}
          className="aspect-[4/3] w-full"
        />
      </div>

      {images.length > 1 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {images.map((src, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectImage(idx)}
              aria-label={`View image ${idx + 1}`}
              className={cn(
                'h-16 w-20 shrink-0 overflow-hidden rounded border bg-[#F1F3F6] transition-colors',
                selectedImageIdx === idx
                  ? 'border-[#172554] ring-1 ring-[#172554]/20'
                  : 'border-[#E5E7EB] hover:border-[#CBD5E1]'
              )}
            >
              <ProductImage
                src={src}
                alt={`${productTitle} view ${idx + 1}`}
                category={category}
                className="h-full w-full"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

