import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductImage } from '@/components/common/ProductImage';

export function CategoryTile({ category }) {
  return (
    <Link
      to={`/results?category=${encodeURIComponent(category.slug)}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-[#E5E7EB] bg-white transition-all hover:border-[#465BE5]/50 hover:shadow-card"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-[#F1F3F6]">
        <ProductImage
          src={category.imageUrl}
          alt={category.name}
          category={category.name}
          className="h-full w-full"
          imgClassName="group-hover:scale-[1.04]"
          fit="cover"
        />
      </div>
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          <h3 className="text-[14px] font-[650] tracking-tight text-[#17202F] group-hover:text-[#465BE5] transition-colors">
            {category.name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[11.5px] text-[#697586]">
            {category.tagline}
          </p>
        </div>
        <span className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-[600] text-[#172554] group-hover:text-[#465BE5]">
          <span>Shop department</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

