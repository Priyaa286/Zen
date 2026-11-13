import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tags,
  Package,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { MARKETPLACE_CATEGORIES } from '@/data/categories';
import { getSellerStoreMe, getSellerProducts } from '@/services/sellerService';

export default function SellerCategories() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.email) return;
      try {
        const storeData = await getSellerStoreMe(user.email);
        if (mounted && storeData) {
          setStore(storeData);
          if (storeData.id) {
            const list = await getSellerProducts(storeData.id);
            if (mounted) setProducts(list || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user?.email]);

  const curr = store?.merchantCurrency || 'JPY';

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-[#465BE5]" />
      </div>
    );
  }

  // Calculate per-category metrics
  const categoryStats = MARKETPLACE_CATEGORIES.map((cat) => {
    const matchedProducts = products.filter(
      (p) => p.category?.toLowerCase() === cat.slug.toLowerCase()
    );
    const count = matchedProducts.length;
    const totalUnits = matchedProducts.reduce((s, p) => s + (p.stock || 0), 0);
    const valuation = matchedProducts.reduce(
      (s, p) => s + (p.stock || 0) * (p.originalPrice || 0),
      0
    );

    return {
      ...cat,
      count,
      totalUnits,
      valuation,
    };
  });

  return (
    <div className="space-y-6">
      {/* Page Toolbar */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-3.5 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#17202F]">
            Categories
          </h1>
          <p className="mt-0.5 text-xs text-[#697586]">
            Catalog distribution across merchandising departments.
          </p>
        </div>

        <Button asChild size="sm" className="bg-[#172554] text-white hover:bg-[#1E3A8A] text-xs font-semibold h-9 px-4 gap-1.5 shadow-xs">
          <Link to="/seller/products/new">
            <Package className="h-3.5 w-3.5" />
            <span>Add Product</span>
          </Link>
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categoryStats.map((cat) => (
          <div
            key={cat.slug}
            className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-subtle flex flex-col justify-between group hover:border-blue-200 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#465BE5]">
                    <Tags className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#17202F]">{cat.name}</h3>
                    <p className="text-[11px] text-[#697586]">{cat.subcategories?.length || 0} subcategories</p>
                  </div>
                </div>

                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10.5px] font-bold text-[#17202F] tabular-nums">
                  {cat.count} listings
                </span>
              </div>

              <p className="mt-3 text-xs text-[#697586] leading-relaxed line-clamp-2">
                {cat.tagline}
              </p>

              <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-[#697586]">Stock Units:</span>
                  <p className="font-semibold text-[#17202F] tabular-nums">{cat.totalUnits} units</p>
                </div>
                <div>
                  <span className="text-[11px] text-[#697586]">Valuation:</span>
                  <p className="font-semibold text-[#17202F] tabular-nums">
                    {curr === 'JPY' ? '¥' : '$'}{cat.valuation.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-[#697586]">Department #{cat.slug}</span>
              <Link
                to={`/seller/products`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#465BE5] hover:underline"
              >
                <span>View Products</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

