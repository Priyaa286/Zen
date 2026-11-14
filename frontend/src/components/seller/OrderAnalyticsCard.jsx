import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export function OrderAnalyticsCard({ orders = [], onNavigateTab, onSelectStatus }) {
  const totalOrders = orders.length;

  const statusConfig = [
    {
      key: 'NEW',
      aliases: ['NEW', 'PENDING'],
      label: 'New & Pending',
      color: '#F59E0B',
      bgColor: 'bg-amber-500',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      key: 'PROCESSING',
      aliases: ['PROCESSING', 'CONFIRMED'],
      label: 'In Processing',
      color: '#465BE5',
      bgColor: 'bg-[#465BE5]',
      badgeBg: 'bg-blue-50 text-[#172554] border-blue-200',
    },
    {
      key: 'SHIPPED',
      aliases: ['SHIPPED'],
      label: 'In Transit / Shipped',
      color: '#0284C7',
      bgColor: 'bg-sky-500',
      badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    {
      key: 'DELIVERED',
      aliases: ['DELIVERED', 'COMPLETED'],
      label: 'Completed / Delivered',
      color: '#10B981',
      bgColor: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      key: 'CANCELLED',
      aliases: ['CANCELLED', 'REFUNDED'],
      label: 'Cancelled / Returned',
      color: '#9CA3AF',
      bgColor: 'bg-gray-400',
      badgeBg: 'bg-gray-50 text-gray-700 border-gray-200',
    },
  ];

  const breakdown = statusConfig.map((item) => {
    const count = orders.filter((o) => item.aliases.includes(o.status)).length;
    const percentage = totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : 0;
    return {
      ...item,
      count,
      percentage: Number(percentage),
    };
  });

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-subtle flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F6]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#465BE5]">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-[#17202F]">Order Performance</h3>
              <p className="text-[11px] text-[#697586]">Distribution across fulfillment lifecycle</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-[#17202F] tabular-nums">{totalOrders}</span>
            <span className="ml-1 text-[11.5px] text-[#697586]">total orders</span>
          </div>
        </div>

        {/* Multi-segmented horizontal progress bar */}
        <div className="mt-4">
          <div className="h-3 w-full overflow-hidden rounded-full bg-[#F3F4F6] flex">
            {totalOrders > 0 ? (
              breakdown.map((item) =>
                item.percentage > 0 ? (
                  <div
                    key={item.key}
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full hover:opacity-90"
                    title={`${item.label}: ${item.count} (${item.percentage}%)`}
                  />
                ) : null
              )
            ) : (
              <div className="h-full w-full bg-gray-200" />
            )}
          </div>
        </div>

        {/* Status list with interactive filters */}
        <div className="mt-4 divide-y divide-[#F1F3F6]">
          {breakdown.map((item) => (
            <div
              key={item.key}
              onClick={() => {
                if (onSelectStatus) onSelectStatus(item.key);
                else if (onNavigateTab) onNavigateTab('orders');
              }}
              className="flex items-center justify-between py-2.5 px-1 hover:bg-[#F9FAFB] rounded-lg cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-[#17202F] group-hover:text-[#465BE5]">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-3 tabular-nums">
                <span className="text-xs font-semibold text-[#17202F]">{item.count}</span>
                <span className="text-[11px] font-medium text-[#697586] w-12 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-[#F1F3F6] flex items-center justify-between text-xs">
        <span className="text-[#697586] text-[11px]">Click status to view filtered orders</span>
        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('orders')}
          className="inline-flex items-center gap-1 font-semibold text-[#465BE5] hover:underline"
        >
          View all orders
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

