import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export function RecentOrdersCard({ orders = [], currency = 'JPY', onNavigateTab, onSelectOrder }) {
  const latestOrders = orders.slice(0, 5);

  const formatCurrency = (val) => {
    if (typeof val !== 'number') return `${currency} 0`;
    const sym =
      currency === 'JPY' ? '¥' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency + ' ';
    return `${sym}${val.toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SHIPPED':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'NEW':
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-subtle overflow-hidden flex flex-col justify-between">
      <div>
        <div className="border-b border-[#F1F3F6] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#465BE5]">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-[#17202F]">Recent Customer Orders</h3>
              <p className="text-[11px] text-[#697586]">Latest cross-border purchases</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#697586] tabular-nums">
            {orders.length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#F1F3F6] text-[11px] font-semibold text-[#697586] bg-[#F9FAFB]/60">
                <th className="px-5 py-2.5">Order</th>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Buyer Dest</th>
                <th className="px-3 py-2.5 text-right">Amount</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3F6]">
              {latestOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#697586]">
                    No orders recorded yet.
                  </td>
                </tr>
              ) : (
                latestOrders.map((order) => {
                  const dateStr = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recent';
                  const amount = order.itemsTotalOriginal || order.total || 0;

                  return (
                    <tr key={order.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-5 py-3 font-semibold text-[#17202F]">
                        {order.orderNumber || order.id}
                      </td>
                      <td className="px-3 py-3 text-[#697586] whitespace-nowrap">{dateStr}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#374151]">
                          {order.destinationCountry || 'GL'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-[#17202F] tabular-nums whitespace-nowrap">
                        {formatCurrency(amount)}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                            getStatusBadge(order.status)
                          )}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectOrder) onSelectOrder(order);
                            else if (onNavigateTab) onNavigateTab('orders');
                          }}
                          className="text-xs font-semibold text-[#465BE5] hover:underline"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-[#F1F3F6] px-5 py-3 bg-[#F9FAFB]/40 flex items-center justify-between text-xs">
        <span className="text-[#697586] text-[11px]">Showing 5 most recent orders</span>
        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('orders')}
          className="inline-flex items-center gap-1 font-semibold text-[#465BE5] hover:underline"
        >
          View all orders ({orders.length})
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

