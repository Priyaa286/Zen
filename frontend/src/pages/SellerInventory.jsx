import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  AlertTriangle,
  Package,
  Plus,
  Minus,
  RefreshCw,
  Search,
  CheckCircle2,
  TrendingDown,
  Warehouse,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/utils/cn';
import {
  getSellerStoreMe,
  getSellerProducts,
  updateSellerProduct,
} from '@/services/sellerService';

export default function SellerInventory() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

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
        showToast({ title: 'Error', description: err.message, tone: 'critical' });
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

  const handleAdjustStock = async (prod, delta) => {
    const newStock = Math.max(0, (prod.stock || 0) + delta);
    setUpdatingId(prod.id);
    try {
      await updateSellerProduct(store.id, prod.id, { ...prod, stock: newStock });
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, stock: newStock } : p))
      );
      showToast({
        title: 'Stock adjusted',
        description: `${prod.title}: now ${newStock} units in warehouse.`,
        tone: 'success',
      });
    } catch (err) {
      showToast({ title: 'Failed', description: err.message, tone: 'critical' });
    } finally {
      setUpdatingId(null);
    }
  };

  const totalUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const lowStockCount = products.filter((p) => (p.stock || 0) <= 5 && (p.stock || 0) > 0).length;
  const outOfStockCount = products.filter((p) => (p.stock || 0) === 0).length;
  const totalValuation = products.reduce(
    (sum, p) => sum + (p.stock || 0) * (p.originalPrice || 0),
    0
  );

  const filtered = products.filter((p) => {
    const matchSearch =
      !search.trim() ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchLow = !onlyLowStock || (p.stock || 0) <= 5;
    return matchSearch && matchLow;
  });

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-[#465BE5]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Toolbar */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-3.5 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#17202F]">
            Inventory
          </h1>
          <p className="mt-0.5 text-xs text-[#697586]">
            Real-time warehouse stock tracking and replenishment.
          </p>
        </div>

        <Button asChild size="sm" className="bg-[#172554] text-white hover:bg-[#1E3A8A] text-xs font-semibold h-9 px-4 gap-1.5 shadow-xs">
          <Link to="/seller/products/new">
            <Plus className="h-3.5 w-3.5" />
            <span>Add New SKU</span>
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-subtle">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#697586]">
            Total Stock Units
          </p>
          <p className="text-2xl font-bold text-[#17202F] mt-1 tabular-nums">
            {totalUnits.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#697586] mt-0.5">Across {products.length} live listings</p>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-subtle">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Low Stock Alerts
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">
            {lowStockCount}
          </p>
          <p className="text-[11px] text-[#697586] mt-0.5">5 or fewer units remaining</p>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-subtle">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
            Out of Stock
          </p>
          <p className="text-2xl font-bold text-rose-600 mt-1 tabular-nums">
            {outOfStockCount}
          </p>
          <p className="text-[11px] text-[#697586] mt-0.5">Requires replenishment</p>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-subtle">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#697586]">
            Inventory Valuation
          </p>
          <p className="text-2xl font-bold text-[#17202F] mt-1 tabular-nums">
            {curr === 'JPY' ? '¥' : '$'}{totalValuation.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#697586] mt-0.5">At current selling prices</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search SKU or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] bg-white py-1.5 pl-9 pr-3 text-xs text-[#17202F] focus:border-[#465BE5] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyLowStock((prev) => !prev)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
              onlyLowStock
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-[#E5E7EB] bg-white text-[#697586] hover:bg-[#F8FAFC]'
            )}
          >
            {onlyLowStock ? 'Showing Low Stock Only' : 'Filter Low Stock'}
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[11px] font-semibold text-[#697586] bg-[#F8FAFC]">
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Unit Price</th>
                <th className="py-3 px-3 text-center">Available Stock</th>
                <th className="py-3 px-3 text-right">Total Value</th>
                <th className="py-3 px-4 text-right">Quick Stock Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filtered.map((prod) => {
                const stock = prod.stock || 0;
                const isLow = stock <= 5;
                const isOut = stock === 0;

                return (
                  <tr key={prod.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.imageUrl}
                          alt={prod.title}
                          className="h-10 w-10 rounded-lg object-cover border border-[#E5E7EB]"
                        />
                        <div>
                          <p className="font-semibold text-[#17202F] line-clamp-1 max-w-sm">
                            {prod.title}
                          </p>
                          <p className="font-mono text-[11px] text-[#697586]">
                            {prod.sku || `SKU-${prod.id}`}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="rounded bg-[#F1F3F6] px-2 py-0.5 text-[11px] text-[#374151]">
                        {prod.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-medium text-[#17202F] tabular-nums">
                      {curr === 'JPY' ? '¥' : '$'}{(prod.originalPrice || 0).toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold tabular-nums',
                          isOut
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isLow
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        )}
                      >
                        {isLow && <AlertTriangle className="h-2.5 w-2.5" />}
                        {stock} units
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-[#17202F] tabular-nums">
                      {curr === 'JPY' ? '¥' : '$'}{(stock * (prod.originalPrice || 0)).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          disabled={updatingId === prod.id || stock <= 0}
                          onClick={() => handleAdjustStock(prod, -1)}
                          className="h-7 w-7 rounded-md border border-[#E5E7EB] bg-white flex items-center justify-center text-[#697586] hover:bg-[#F8FAFC] disabled:opacity-40"
                          title="Decrease 1"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={updatingId === prod.id}
                          onClick={() => handleAdjustStock(prod, 1)}
                          className="h-7 w-7 rounded-md border border-[#E5E7EB] bg-white flex items-center justify-center text-[#697586] hover:bg-[#F8FAFC] disabled:opacity-40"
                          title="Add 1"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={updatingId === prod.id}
                          onClick={() => handleAdjustStock(prod, 10)}
                          className="h-7 px-2 rounded-md border border-[#E5E7EB] bg-white text-[11px] font-semibold text-[#172554] hover:bg-blue-50"
                          title="Restock batch of 10"
                        >
                          +10
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

