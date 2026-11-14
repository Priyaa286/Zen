import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  Receipt,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSellerRevenueStatement, downloadSellerReportCsv } from '@/services/sellerService';
import { useToast } from '@/context/ToastContext';

export function RevenueStatementTab({ storeId, currency = 'JPY' }) {
  const { showToast } = useToast();
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStatement = async () => {
      setLoading(true);
      try {
        const data = await getSellerRevenueStatement(storeId);
        if (isMounted) setStatement(data);
      } catch (err) {
        showToast({
          title: 'Error loading statement',
          description: err.message,
          tone: 'critical',
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (storeId) {
      fetchStatement();
    }
    return () => {
      isMounted = false;
    };
  }, [storeId]);

  const handleExport = () => {
    try {
      downloadSellerReportCsv(
        'revenue_statement',
        statement,
        `zen_revenue_statement_${Date.now()}.csv`
      );
      showToast({
        title: 'Statement Exported',
        description: 'Financial ledger downloaded as CSV.',
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

  const curr = statement?.currency || currency;

  return (
    <div className="space-y-6">
      {/* Statement Header Card */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#465BE5]">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#17202F]">Merchant Revenue Statement</h2>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                Reconciled
              </span>
            </div>
            <p className="text-xs text-[#697586]">
              Period: {statement?.statementPeriod || 'Current Month'} • All accounting entries in {curr}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2 text-xs"
        >
          <Download className="h-3.5 w-3.5 text-[#697586]" />
          Export Statement CSV
        </Button>
      </div>

      {/* Accounting Breakdown Sections */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-subtle overflow-hidden">
        {/* Section 1: Gross Sales */}
        <div className="border-b border-[#E5E7EB] bg-[#F7F8FA] px-6 py-3 text-xs font-bold uppercase tracking-[0.04em] text-[#17202F]">
          Section 1: Gross Invoiced Sales
        </div>
        <div className="p-6 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#697586]">Product Merchandise Sales</span>
            <span className="font-semibold text-[#17202F] tabular-nums">
              {curr} {statement?.grossSales?.productSales?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#697586]">International Shipping Fees Collected</span>
            <span className="font-semibold text-[#17202F] tabular-nums">
              {curr} {statement?.grossSales?.shippingCollected?.toLocaleString() || 0}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between font-bold text-sm text-[#17202F]">
            <span>Total Gross Sales</span>
            <span className="tabular-nums">
              {curr} {statement?.grossSales?.totalGross?.toLocaleString() || 0}
            </span>
          </div>
        </div>

        {/* Section 2: Deductions */}
        <div className="border-b border-t border-[#E5E7EB] bg-[#F7F8FA] px-6 py-3 text-xs font-bold uppercase tracking-[0.04em] text-[#17202F]">
          Section 2: Deductions, Fees & Refunds
        </div>
        <div className="p-6 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#697586]">Customer Returns & Refunds</span>
            <span className="font-semibold text-[#17202F] tabular-nums">
              {curr} {statement?.deductions?.customerRefunds?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-rose-700">
            <span>Zen Global Marketplace Commission (5.0%)</span>
            <span className="font-semibold tabular-nums">
              - {curr} {statement?.deductions?.platformCommission?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-rose-700">
            <span>Payment Processing Gateway Fees (PayPal Sandbox 2.9% + fix)</span>
            <span className="font-semibold tabular-nums">
              - {curr} {statement?.deductions?.paymentProcessingFees?.toLocaleString() || 0}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between font-bold text-sm text-rose-700">
            <span>Total Operational Deductions</span>
            <span className="tabular-nums">
              - {curr} {statement?.deductions?.totalDeductions?.toLocaleString() || 0}
            </span>
          </div>
        </div>

        {/* Section 3: Net Revenue */}
        <div className="border-b border-t border-emerald-200 bg-emerald-50/40 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-emerald-950">Section 3: Net Merchant Earnings</h3>
            <p className="text-xs text-emerald-700">Net revenue margin: {statement?.netRevenue?.netMarginPercent || 92.1}%</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold tracking-tight text-emerald-900 tabular-nums">
              {curr} {statement?.netRevenue?.netMerchantRevenue?.toLocaleString() || 0}
            </span>
          </div>
        </div>

        {/* Section 4: Settlement Reconciliation */}
        <div className="border-b border-t border-[#E5E7EB] bg-[#F7F8FA] px-6 py-3 text-xs font-bold uppercase tracking-[0.04em] text-[#17202F]">
          Section 4: Disbursement & Settlement Reconciliation
        </div>
        <div className="p-6 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#697586]">Previously Disbursed to Bank / PayPal Account</span>
            <span className="font-semibold text-[#17202F] tabular-nums">
              {curr} {statement?.settlementReconciliation?.previouslyPaidOut?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[#697586]">In-Transit Escrow (72h post-dispatch hold)</span>
              <Clock className="h-3 w-3 text-amber-500" />
            </div>
            <span className="font-semibold text-amber-700 tabular-nums">
              {curr} {statement?.settlementReconciliation?.inTransitEscrow?.toLocaleString() || 0}
            </span>
          </div>
          <div className="flex items-center justify-between font-bold text-emerald-800">
            <span>Available for Next Settlement Batch</span>
            <span className="tabular-nums">
              {curr} {statement?.settlementReconciliation?.availableForNextBatch?.toLocaleString() || 0}
            </span>
          </div>
          <div className="pt-3 border-t border-gray-100 text-[11px] text-[#697586]">
            Schedule: {statement?.settlementReconciliation?.payoutSchedule}
          </div>
        </div>
      </div>
    </div>
  );
}

