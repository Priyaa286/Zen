import { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Globe2,
  Package,
  Layers,
  ArrowUpRight,
  Download,
  DollarSign,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricKpiCard } from './MetricKpiCard';
import { RevenueAreaChart, OrderVolumeBarChart } from './FinancialCharts';
import { DateRangeSelector } from './DateRangeSelector';
import { getSellerSalesAnalytics, downloadSellerReportCsv } from '@/services/sellerService';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';

export function SalesAnalyticsTab({ storeId, currency = 'JPY' }) {
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const data = await getSellerSalesAnalytics(storeId, dateRange);
        if (mounted) setAnalyticsData(data);
      } catch (err) {
        showToast({
          title: 'Error loading sales analytics',
          description: err.message,
          tone: 'critical',
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (storeId) {
      fetchAnalytics();
    }
    return () => {
      mounted = false;
    };
  }, [storeId, dateRange]);

  const summary = analyticsData?.summary || {
    grossSales: 0,
    netRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    periodGrowthGrossPct: 0,
    periodGrowthNetPct: 0,
    periodGrowthOrdersPct: 0,
    periodGrowthAovPct: 0,
  };

  const handleExport = () => {
    try {
      downloadSellerReportCsv('sales', analyticsData, `zen_sales_analytics_${dateRange}.csv`);
      showToast({
        title: 'Sales Report Downloaded',
        description: `Exported timeseries analytics for ${dateRange}.`,
        tone: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Export failed',
        description: err.message,
        tone: 'critical',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Date Filter & Export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-subtle">
        <div>
          <h2 className="text-base font-bold text-[#17202F]">Sales & Revenue Growth Analytics</h2>
          <p className="text-xs text-[#697586]">
            Real-time performance tracking denominated in merchant base currency ({currency}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 gap-1.5 text-xs text-[#17202F]"
          >
            <Download className="h-3.5 w-3.5 text-[#697586]" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Period Comparison Metric Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricKpiCard
          label="Period Gross Sales"
          value={summary.grossSales}
          currency={currency}
          deltaPct={summary.periodGrowthGrossPct}
          subtitle="vs. prior period"
          icon={DollarSign}
        />
        <MetricKpiCard
          label="Net Merchant Revenue"
          value={summary.netRevenue}
          currency={currency}
          deltaPct={summary.periodGrowthNetPct}
          subtitle="after 5% platform & gateway fees"
          tone="emerald"
        />
        <MetricKpiCard
          label="Order Volume"
          value={summary.totalOrders}
          deltaPct={summary.periodGrowthOrdersPct}
          subtitle="completed & processing"
          icon={ShoppingBag}
        />
        <MetricKpiCard
          label="Average Order Value"
          value={summary.averageOrderValue}
          currency={currency}
          deltaPct={summary.periodGrowthAovPct}
          subtitle="per buyer checkout"
          icon={TrendingUp}
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Revenue Area Chart */}
        <div className="lg:col-span-2 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#17202F]">Revenue Timeseries</h3>
              <p className="text-[11.5px] text-[#697586]">
                Gross vs Net disbursement over time
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#465BE5]">
              +{summary.periodGrowthGrossPct}% growth
            </span>
          </div>

          <div className="pt-4">
            <RevenueAreaChart
              data={analyticsData?.timeline}
              currency={currency}
              height={260}
            />
          </div>
        </div>

        {/* Right 1 Col: Order Volume Bars */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-subtle flex flex-col justify-between">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-[#17202F]">Order Volume Distribution</h3>
            <p className="text-[11.5px] text-[#697586]">Orders processed per interval</p>
          </div>

          <div className="pt-4 flex-1 flex flex-col justify-center">
            <OrderVolumeBarChart
              data={analyticsData?.timeline}
              height={220}
              barColor="#465BE5"
            />
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#697586]">
            <span>Total Units Fulfilled:</span>
            <span className="font-bold text-[#17202F]">
              {analyticsData?.timeline?.reduce((s, p) => s + p.orders, 0) || 0} orders
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Grid: Category Revenue & Top Products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Category Breakdown (1 Col) */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#465BE5]" />
              <h3 className="text-sm font-bold text-[#17202F]">Category Distribution</h3>
            </div>
            <span className="text-[11px] text-[#697586]">Share %</span>
          </div>

          <div className="mt-4 space-y-3.5">
            {(analyticsData?.categoryBreakdown || []).map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#17202F]">{cat.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#697586] tabular-nums">
                      {currency} {cat.revenue.toLocaleString()}
                    </span>
                    <span className="font-mono font-bold text-[#17202F]">
                      {cat.sharePct}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F3F6]">
                  <div
                    className="h-full rounded-full bg-[#465BE5]"
                    style={{ width: `${cat.sharePct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products Ranking (2 Cols) */}
        <div className="lg:col-span-2 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[#465BE5]" />
              <h3 className="text-sm font-bold text-[#17202F]">Top Performing Listings</h3>
            </div>
            <span className="text-xs text-[#697586]">Ranked by gross sales volume</span>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[11px] font-semibold text-[#697586]">
                  <th className="py-2.5">Product</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5 text-right">Units Sold</th>
                  <th className="py-2.5 text-right">Gross Sales ({currency})</th>
                  <th className="py-2.5 text-right">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(analyticsData?.topProducts || []).map((prod, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F8FA] transition-colors">
                    <td className="py-2.5 font-medium text-[#17202F]">
                      {prod.title}
                    </td>
                    <td className="py-2.5 text-[#697586]">{prod.category}</td>
                    <td className="py-2.5 text-right font-semibold text-[#17202F] tabular-nums">
                      {prod.unitsSold}
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-800 tabular-nums">
                      {prod.grossRevenue.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold',
                          prod.status === 'LOW_STOCK'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        )}
                      >
                        {prod.stockRemaining} left ({prod.status.replace('_', ' ')})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

