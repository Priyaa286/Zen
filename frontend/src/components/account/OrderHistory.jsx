import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  Package,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/currencyFormatter';

const STATUS_BADGE = {
  COMPLETED: { label: 'Completed', variant: 'verified', Icon: CheckCircle2 },
  PAID: { label: 'Paid', variant: 'verified', Icon: CheckCircle2 },
  PENDING: { label: 'Pending', variant: 'secondary', Icon: Clock3 },
  FAILED: { label: 'Failed', variant: 'destructive', Icon: ShieldAlert },
};

export function OrderHistory() {
  const { orders, refreshOrders } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshOrders();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#E6E5E0] bg-white p-6 shadow-subtle">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E5E0] pb-4">
        <div>
          <h2 className="text-[18px] font-[640] tracking-[-0.015em] text-[#151923]">
            Order History
          </h2>
          <p className="mt-0.5 text-[13px] text-[#747987]">
            Your past PayPal purchases and estimated delivery windows.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh orders
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#F8F7F4] text-[#747987]">
            <Package className="h-5 w-5" />
          </div>
          <p className="text-[15px] font-[600] text-[#151923]">No completed orders yet</p>
          <p className="mt-1 max-w-sm text-[13px] text-[#747987]">
            Once you complete an international purchase through Zen PayPal checkout, receipts and
            customs details appear here.
          </p>
          <Button asChild className="mt-4">
            <Link to="/results">Shop international marketplace</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-3.5">
          {orders.map((order) => {
            const normalizedStatus = String(order.status || 'COMPLETED').toUpperCase();
            const badgeCfg = STATUS_BADGE[normalizedStatus] || STATUS_BADGE.COMPLETED;
            const StatusIcon = badgeCfg.Icon;
            const totalAmount = order.totalLandedCost ?? order.totalAmount ?? order.amount ?? 0;
            const currencyCode = order.currency || 'USD';
            const productTitle =
              order.product?.title || order.productTitle || 'International marketplace item';
            const formattedDate = order.paidAt || order.createdAt
              ? new Date(order.paidAt || order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recent';

            return (
              <div
                key={order.orderId}
                className="flex flex-col justify-between gap-4 rounded-xl border border-[#E6E5E0] bg-[#FAF9F7] p-4 sm:flex-row sm:items-center"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tabular-nums text-[13.5px] font-[640] text-[#151923]">
                      {order.orderId}
                    </span>
                    <Badge variant={badgeCfg.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {badgeCfg.label}
                    </Badge>
                    <span className="text-[12px] text-[#747987]">{formattedDate}</span>
                  </div>

                  <p className="text-[14px] font-[550] text-[#151923]">
                    {productTitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#747987]">
                    {order.paypalTransactionId ? (
                      <span className="tabular-nums">PayPal TXN: {order.paypalTransactionId}</span>
                    ) : null}
                    {order.estimatedDelivery ? (
                      <span>Delivery: {order.estimatedDelivery}</span>
                    ) : null}
                    {order.shippingAddress?.countryCode ? (
                      <span>Destination: {order.shippingAddress.countryCode}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-[#E6E5E0] pt-3 sm:border-t-0 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] uppercase tracking-[0.06em] text-[#747987]">
                      Total paid
                    </p>
                    <p className="tabular-nums text-[16px] font-[680] text-[#151923]">
                      {formatCurrency(totalAmount, currencyCode, { includeCode: true })}
                    </p>
                  </div>

                  <Button asChild variant="outline" size="sm">
                    <Link to={`/order-success?orderId=${encodeURIComponent(order.orderId)}`}>
                      Receipt
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
