import { X, CheckCircle2, Clock, AlertTriangle, ExternalLink, ShieldCheck, ArrowRight, Coins } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

export function TransactionDetailDrawer({ transaction, isOpen, onClose, onNavigateOrder }) {
  if (!isOpen || !transaction) return null;

  const isSuccess = transaction.status === 'SUCCESS';
  const isRefunded = transaction.status === 'REFUNDED';
  const isPending = transaction.status === 'PENDING';

  // Compute exchange rate if different currencies
  const isCrossCurrency = transaction.buyerCurrency && transaction.buyerCurrency !== transaction.merchantCurrency;
  let fxRateDisplay = null;
  if (isCrossCurrency && transaction.buyerPaidAmount && transaction.grossAmount) {
    const rate = (transaction.grossAmount / transaction.buyerPaidAmount).toFixed(2);
    fxRateDisplay = `1 ${transaction.buyerCurrency} ≈ ${rate} ${transaction.merchantCurrency}`;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div className="border-b border-[#E5E7EB] px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#465BE5]">
                  Transaction Details
                </span>
                <span className="h-3 w-px bg-gray-200" />
                <span className="font-mono text-xs text-[#697586]">{transaction.id}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-[#697586] hover:bg-[#F7F8FA] hover:text-[#17202F] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold tracking-tight text-[#17202F] tabular-nums">
                  {transaction.merchantCurrency} {transaction.grossAmount?.toLocaleString()}
                </p>
                <p className="text-xs text-[#697586] mt-0.5">
                  Settled into Merchant Base Currency
                </p>
              </div>

              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                  isSuccess && 'bg-emerald-50 text-emerald-700',
                  isRefunded && 'bg-rose-50 text-rose-700',
                  isPending && 'bg-amber-50 text-amber-700'
                )}
              >
                {isSuccess && <CheckCircle2 className="h-3.5 w-3.5" />}
                {isRefunded && <AlertTriangle className="h-3.5 w-3.5" />}
                {isPending && <Clock className="h-3.5 w-3.5" />}
                {transaction.status}
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 px-6 py-5 space-y-6">
            {/* Currency Conversion & Multi-Currency Transparency (Requirement 7) */}
            <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#172554]">
                <Coins className="h-4 w-4 text-[#465BE5]" />
                <span>Multi-Currency Settlement Transparency</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="rounded-lg bg-white p-2.5 border border-blue-100">
                  <p className="text-[10.5px] uppercase font-semibold text-[#697586]">Buyer Payment</p>
                  <p className="font-bold text-[#17202F] text-sm tabular-nums mt-0.5">
                    {transaction.buyerCurrency} {transaction.buyerPaidAmount?.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-[#697586] mt-0.5">Paid via {transaction.paymentProvider}</p>
                </div>

                <div className="rounded-lg bg-white p-2.5 border border-blue-100">
                  <p className="text-[10.5px] uppercase font-semibold text-[#697586]">Merchant Gross</p>
                  <p className="font-bold text-emerald-700 text-sm tabular-nums mt-0.5">
                    {transaction.merchantCurrency} {transaction.grossAmount?.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-[#697586] mt-0.5">Base currency locked</p>
                </div>
              </div>

              {fxRateDisplay && (
                <div className="pt-2 border-t border-blue-100 text-[11px] text-[#475569] flex items-center justify-between">
                  <span>Exchange Rate at Capture:</span>
                  <span className="font-mono font-semibold text-[#172554]">{fxRateDisplay}</span>
                </div>
              )}

              <div className="text-[11px] text-[#697586] flex items-center justify-between">
                <span>Capture Timestamp:</span>
                <span>{new Date(transaction.timestamp).toLocaleString()}</span>
              </div>
            </div>

            {/* Customer & Shipping Corridor Card */}
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8FA] p-4 space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#697586]">
                Buyer Reference & Shipping Destination
              </p>
              <div className="flex items-start justify-between text-xs">
                <div>
                  <p className="font-semibold text-[#17202F]">{transaction.buyerName}</p>
                  <p className="text-[#697586]">{transaction.buyerEmail}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#17202F]">
                    Destination: {transaction.buyerCountry}
                  </span>
                  <p className="text-[11px] text-[#697586]">{transaction.shippingMethod}</p>
                </div>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.04em] text-[#17202F]">
                Itemized Fee & Disbursement Deductions
              </p>

              <div className="rounded-xl border border-[#E5E7EB] bg-white divide-y divide-[#E5E7EB] text-xs">
                <div className="flex items-center justify-between p-3">
                  <span className="text-[#17202F]">Gross Transaction Amount</span>
                  <span className="font-semibold tabular-nums text-[#17202F]">
                    {transaction.merchantCurrency} {transaction.grossAmount?.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50/20 text-rose-700">
                  <div>
                    <span>Zen Global Platform Commission (5.0%)</span>
                    <p className="text-[10px] text-rose-500">Fixed rate applied to gross item value</p>
                  </div>
                  <span className="font-semibold tabular-nums">
                    - {transaction.merchantCurrency} {transaction.platformFee?.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50/20 text-rose-700">
                  <div>
                    <span>Payment Processor Fee (PayPal Sandbox)</span>
                    <p className="text-[10px] text-rose-500">2.9% + fixed merchant interchange</p>
                  </div>
                  <span className="font-semibold tabular-nums">
                    - {transaction.merchantCurrency} {transaction.gatewayFee?.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-50/40 text-emerald-900 font-bold">
                  <div>
                    <span>Net Merchant Proceeds</span>
                    <p className="text-[10px] text-emerald-700 font-normal">Transferred to merchant bank / PayPal</p>
                  </div>
                  <span className="text-sm tabular-nums">
                    {transaction.merchantCurrency} {transaction.netAmount?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Settlement Status & 72h Hold */}
            <div className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#697586]">Settlement Status:</span>
                <span className="font-semibold text-[#17202F]">
                  {transaction.settlementStatus === 'CLEARED' ? 'Cleared for Weekly Payout' : 'In 72h Post-Dispatch Escrow'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#697586]">
                <span>PayPal Capture Reference:</span>
                <span className="font-mono text-[#17202F]">{transaction.providerCaptureId}</span>
              </div>
            </div>

            {/* Linked Order */}
            <div className="rounded-xl border border-[#E5E7EB] p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#17202F]">Order: {transaction.orderId}</p>
                <p className="text-[11px] text-[#697586]">
                  {transaction.itemsCount || 1} package item(s)
                </p>
              </div>
              {onNavigateOrder && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onNavigateOrder(transaction.orderId);
                  }}
                  className="gap-1.5 text-xs"
                >
                  View Order
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="border-t border-[#E5E7EB] px-6 py-4 bg-[#F7F8FA] flex items-center justify-end">
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
