import { useState } from 'react';
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Building,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { MetricKpiCard } from './MetricKpiCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SettlementsTab({ settlement, store, currency = 'JPY' }) {
  const curr = settlement?.currency || currency;
  const isApproved = store?.verificationStatus === 'APPROVED';

  const history = settlement?.settlementHistory || [];

  return (
    <div className="space-y-6">
      {/* Page Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-white px-5 py-3.5 shadow-subtle">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#17202F]">
            Settlements & Payouts
          </h1>
          <p className="mt-0.5 text-xs text-[#697586]">
            Cross-border merchant disbursements, 72h escrow clearance, and payout history.
          </p>
        </div>
      </div>

      {/* 1. Settlement Balances KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricKpiCard
          label="Pending Settlement Balance"
          value={settlement?.pendingClearanceTotal || settlement?.netSettlementBalance || 0}
          currency={curr}
          icon={Clock}
          subtitle="Awaiting 72h post-dispatch clearance"
          badgeText="In Escrow"
        />
        <MetricKpiCard
          label="Completed Historical Payouts"
          value={settlement?.completedPayoutsTotal || 840000}
          currency={curr}
          icon={CheckCircle2}
          tone="emerald"
          subtitle="Successfully wired to PayPal account"
        />
        <MetricKpiCard
          label="Platform Fee Deduction (5%)"
          value={settlement?.platformFee || 0}
          currency={curr}
          icon={Wallet}
          subtitle="Fixed transparent marketplace fee"
        />
      </div>

      {/* 2. 72-Hour Post-Dispatch Clearance Policy Card */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/70 via-blue-50/40 to-white p-5 shadow-subtle space-y-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#465BE5]" />
          <h3 className="text-sm font-bold text-[#172554]">
            Zen Global Cross-Border Settlement & Clearance Policy
          </h3>
        </div>
        <p className="text-xs leading-relaxed text-[#334155]">
          Buyer PayPal sandbox payments are authorized and captured at the moment an international order is placed. To safeguard buyers against international delivery disputes and ensure compliance with cross-border trade regulations, merchant disbursements enter a <strong>72-hour escrow hold</strong> immediately following air waybill tracking confirmation. Once carrier initial scan is validated, funds clear into your weekly batch payout.
        </p>
        <div className="pt-2 flex flex-wrap items-center gap-4 text-[11.5px] text-[#475569]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Automatic Batch Schedule: Every Tuesday 00:00 UTC
          </span>
          <span className="flex items-center gap-1.5">
            <Building className="h-3.5 w-3.5 text-[#465BE5]" />
            Payout Channel: PayPal Sandbox Merchant Account ({store?.businessEmail || 'seller@zen.global'})
          </span>
        </div>
      </div>

      {/* 3. Settlement Payout Ledger */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-subtle overflow-hidden">
        <div className="border-b border-[#E5E7EB] bg-[#F7F8FA] px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#17202F]">Payout & Disbursement Ledger</h3>
            <p className="text-xs text-[#697586]">Historical batches and upcoming transfers</p>
          </div>
          <span className="text-xs font-semibold text-[#17202F]">
            Status: {isApproved ? 'Verified Merchant' : 'Review Required'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[11px] font-semibold text-[#697586] uppercase tracking-[0.04em]">
                <th className="px-6 py-3">Disbursement ID</th>
                <th className="px-6 py-3">Settlement Cycle</th>
                <th className="px-6 py-3">Payout Destination</th>
                <th className="px-6 py-3 text-right">Orders Included</th>
                <th className="px-6 py-3 text-right">Net Amount ({curr})</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Cleared / Scheduled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {history.map((h) => {
                const isPaid = h.status === 'PAID' || h.status === 'TRANSFERRED';
                const isProc = h.status === 'PROCESSING' || h.status === 'PENDING_CLEARANCE';

                return (
                  <tr key={h.id} className="hover:bg-[#F7F8FA] transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#17202F]">
                      {h.id}
                      <p className="text-[10.5px] font-sans font-normal text-[#9CA3AF]">
                        {h.payoutReference || 'PP-BATCH-REF'}
                      </p>
                    </td>

                    <td className="px-6 py-4 font-medium text-[#17202F]">
                      {h.period}
                    </td>

                    <td className="px-6 py-4 text-[#697586]">
                      {h.payoutMethod || 'PayPal Merchant Payout'}
                    </td>

                    <td className="px-6 py-4 text-right tabular-nums font-medium text-[#17202F]">
                      {h.ordersIncluded || 8}
                    </td>

                    <td className="px-6 py-4 text-right tabular-nums font-bold text-emerald-800 text-sm">
                      {h.amount.toLocaleString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                          isPaid && 'bg-emerald-50 text-emerald-700',
                          isProc && 'bg-amber-50 text-amber-700'
                        )}
                      >
                        {isPaid && <CheckCircle2 className="h-3 w-3" />}
                        {isProc && <Clock className="h-3 w-3" />}
                        {h.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right text-[#697586] whitespace-nowrap">
                      {h.transferredAt
                        ? new Date(h.transferredAt).toLocaleDateString()
                        : h.estimatedClearance
                        ? `Est. ${new Date(h.estimatedClearance).toLocaleDateString()}`
                        : '72h Post-Dispatch'}
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

