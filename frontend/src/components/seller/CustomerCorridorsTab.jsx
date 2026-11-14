import { useState, useEffect } from 'react';
import {
  Globe2,
  Plane,
  Truck,
  Users,
  Percent,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { getSellerCustomerCorridors } from '@/services/sellerService';
import { useToast } from '@/context/ToastContext';

export function CustomerCorridorsTab({ storeId, currency = 'JPY' }) {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadCorridors = async () => {
      setLoading(true);
      try {
        const res = await getSellerCustomerCorridors(storeId);
        if (mounted) setData(res);
      } catch (err) {
        showToast({
          title: 'Error loading corridors',
          description: err.message,
          tone: 'critical',
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (storeId) {
      loadCorridors();
    }
    return () => {
      mounted = false;
    };
  }, [storeId]);

  const curr = data?.currency || currency;
  const corridors = data?.corridors || [];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-[#465BE5]" />
            <h2 className="text-base font-bold text-[#17202F]">International Trade Corridors</h2>
          </div>
          <p className="text-xs text-[#697586] mt-1">
            Dispatch Origin: <strong className="text-[#17202F]">{data?.originLocation || 'Tokyo Narita Air Hub'}</strong> ({data?.originCountry || 'JP'})
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#172554]">
          <Plane className="h-3.5 w-3.5 text-[#465BE5]" />
          <span>Cross-Border Air Express Active</span>
        </div>
      </div>

      {/* Corridors Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {corridors.map((c, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-subtle hover:border-[#D1D5DB] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl select-none">{c.flag}</span>
                <span className="rounded-md bg-[#F7F8FA] px-2 py-0.5 font-mono text-[11px] font-bold text-[#17202F]">
                  {c.corridorCode}
                </span>
              </div>

              <h3 className="mt-3 text-sm font-bold text-[#17202F]">{c.destinationName}</h3>
              <p className="text-xs text-[#697586] mt-0.5">{c.orderCount} orders completed</p>

              <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#697586]">Gross Sales:</span>
                  <span className="font-bold text-[#17202F] tabular-nums">
                    {curr} {c.grossRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#697586]">Volume Share:</span>
                  <span className="font-semibold text-[#465BE5] tabular-nums">
                    {c.sharePct}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#697586]">Avg. Transit:</span>
                  <span className="font-semibold text-emerald-700">
                    {c.avgTransitDays} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#697586]">Repeat Buyers:</span>
                  <span className="font-semibold text-[#17202F]">{c.repeatCustomerPct}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#697586]">
              <span>Carrier:</span>
              <span className="font-medium text-[#17202F] truncate max-w-[140px]">{c.primaryCarrier}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Corridor Table Breakdown */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-subtle overflow-hidden">
        <div className="border-b border-[#E5E7EB] bg-[#F7F8FA] px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.04em] text-[#17202F]">
            Cross-Border Logistics & Customs Performance
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[11px] font-semibold text-[#697586]">
                <th className="px-5 py-3">Destination</th>
                <th className="px-5 py-3">Lane</th>
                <th className="px-5 py-3 text-right">Orders</th>
                <th className="px-5 py-3 text-right">Revenue ({curr})</th>
                <th className="px-5 py-3 text-right">Share %</th>
                <th className="px-5 py-3">Carrier Partner</th>
                <th className="px-5 py-3 text-right">Customs Clearance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {corridors.map((c, idx) => (
                <tr key={idx} className="hover:bg-[#F7F8FA] transition-colors">
                  <td className="px-5 py-3 font-semibold text-[#17202F] flex items-center gap-2">
                    <span>{c.flag}</span>
                    <span>{c.destinationName}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-[#697586]">{c.corridorCode}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold">{c.orderCount}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-bold text-emerald-800">
                    {c.grossRevenue.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-[#465BE5] font-semibold">
                    {c.sharePct}%
                  </td>
                  <td className="px-5 py-3 text-[#697586]">{c.primaryCarrier}</td>
                  <td className="px-5 py-3 text-right font-semibold text-emerald-700">
                    {c.customsClearanceRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

