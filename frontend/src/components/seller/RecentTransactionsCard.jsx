import React from 'react';
import { Receipt, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export function RecentTransactionsCard({
  transactions = [],
  currency = 'JPY',
  onNavigateTab,
  onSelectTransaction,
}) {
  const latestTxns = transactions.slice(0, 5);

  const formatCurrency = (val) => {
    if (typeof val !== 'number') return `${currency} 0`;
    const sym =
      currency === 'JPY' ? '¥' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency + ' ';
    return `${sym}${val.toLocaleString()}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SETTLED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
      case 'PENDING_CLEARANCE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-[#465BE5]">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-[#17202F]">Recent Payment Ledger</h3>
              <p className="text-[11px] text-[#697586]">Net disbursements & processing fees</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#697586] tabular-nums">
            {transactions.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#F1F3F6] text-[11px] font-semibold text-[#697586] bg-[#F9FAFB]/60">
                <th className="px-5 py-2.5">Txn ID</th>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5 text-right">Gross</th>
                <th className="px-3 py-2.5 text-right">Net Proceeds</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-5 py-2.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F3F6]">
              {latestTxns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#697586]">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                latestTxns.map((txn) => {
                  const dateStr = txn.date
                    ? new Date(txn.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <tr key={txn.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-5 py-3 font-mono text-[11.5px] font-medium text-[#17202F]">
                        {txn.id}
                      </td>
                      <td className="px-3 py-3 text-[#697586] whitespace-nowrap">{dateStr}</td>
                      <td className="px-3 py-3 text-right font-medium text-[#17202F] tabular-nums whitespace-nowrap">
                        {formatCurrency(txn.grossAmount || 0)}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-emerald-700 tabular-nums whitespace-nowrap">
                        {formatCurrency(txn.netProceeds || txn.netSettlement || 0)}
                      </td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                            getStatusBadge(txn.status)
                          )}
                        >
                          {txn.status === 'PENDING_CLEARANCE' ? 'PENDING' : txn.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectTransaction) onSelectTransaction(txn);
                            else if (onNavigateTab) onNavigateTab('transactions');
                          }}
                          className="text-xs font-semibold text-[#465BE5] hover:underline"
                        >
                          Details
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
        <span className="text-[#697586] text-[11px]">Fee deductions: 5% Zen + PayPal</span>
        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('transactions')}
          className="inline-flex items-center gap-1 font-semibold text-[#465BE5] hover:underline"
        >
          View all transactions ({transactions.length})
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

