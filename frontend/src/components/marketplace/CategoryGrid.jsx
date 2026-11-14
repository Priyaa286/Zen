import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getAllCategories } from '@/data/categories';
import { CategoryTile } from './CategoryTile';

const TARGET_12_SLUGS = [
  'electronics',
  'fashion',
  'home-kitchen',
  'beauty-personal-care',
  'sports-outdoors',
  'books',
  'toys-games',
  'grocery',
  'automotive',
  'baby-kids',
  'office-products',
  'pet-supplies',
];

export function CategoryGrid() {
  const allCategories = getAllCategories();
  const categories = TARGET_12_SLUGS.map((slug) =>
    allCategories.find((c) => c.slug === slug)
  ).filter(Boolean);

  return (
    <section aria-labelledby="shop-by-category-heading" className="zen-container py-10 sm:py-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="zen-eyebrow text-[#465BE5]">Browse Departments</p>
          <h2
            id="shop-by-category-heading"
            className="mt-1 text-[22px] sm:text-[28px] font-[680] tracking-[-0.025em] text-[#17202F]"
          >
            Shop by Category
          </h2>
          <p className="mt-1 text-[13.5px] text-[#697586]">
            Explore global merchandise sourced directly from trusted overseas flagships.
          </p>
        </div>

        <Link
          to="/results"
          className="inline-flex items-center gap-1.5 text-[13px] font-[600] text-[#172554] hover:text-[#465BE5] transition-colors"
        >
          <span>View all 15 departments</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((category) => (
          <CategoryTile key={category.slug} category={category} />
        ))}
      </div>
    </section>
  );
}

export default CategoryGrid;

