import React from 'react';
import { Package, ArrowRight, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cn';

export function TopProductsCard({ products = [], currency = 'JPY', onNavigateTab }) {
  const topList = products.slice(0, 5);

  const formatCurrency = (val) => {
    if (typeof val !== 'number') return `${currency} 0`;
    const sym =
      currency === 'JPY' ? '¥' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency + ' ';
    return `${sym}${val.toLocaleString()}`;
  };

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-subtle flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F6]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-[#17202F]">Top-Selling Products</h3>
              <p className="text-[11px] text-[#697586]">Ranked by cross-border sales volume</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#697586] tabular-nums">
            Top {topList.length} items
          </span>
        </div>

        {topList.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#697586]">
            No sales recorded in this period.
          </div>
        ) : (
          <div className="mt-3 divide-y divide-[#F1F3F6]">
            {topList.map((item, idx) => (
              <div key={item.id || idx} className="py-2.5 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F8F9FA]">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[#697586]">
                        #{idx + 1}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#17202F] group-hover:text-[#465BE5] transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#697586]">
                      <span>{item.category || 'General'}</span>
                      <span className="text-[#D1D5DB]">•</span>
                      <span className="font-medium text-[#17202F] tabular-nums">
                        {item.unitsSold || 0} sold
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-[#17202F] tabular-nums">
                    {formatCurrency(item.grossRevenue || 0)}
                  </div>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <div className="h-1.5 w-12 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, item.sharePct || 10)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-[#697586] tabular-nums">
                      {item.sharePct || 0}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 mt-2 border-t border-[#F1F3F6] flex items-center justify-between text-xs">
        <span className="text-[#697586] text-[11px]">Updated dynamically from settled carts</span>
        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('products')}
          className="inline-flex items-center gap-1 font-semibold text-[#465BE5] hover:underline"
        >
          View all products
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

