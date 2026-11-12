import { cn } from '@/utils/cn';

export function MetricKpiCard({
  label,
  value,
  currency = '',
  deltaPct = null,
  periodLabel = 'vs previous period',
  className = '',
}) {
  const hasDelta = typeof deltaPct === 'number' && !isNaN(deltaPct);
  const isPositive = hasDelta && deltaPct > 0;
  const isNegative = hasDelta && deltaPct < 0;

  return (
    <div
      className={cn(
        'flex h-full min-h-[112px] flex-col justify-between rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-subtle transition-all duration-150 hover:border-[#D1D5DB]',
        className
      )}
    >
      <p className="text-xs font-medium text-[#697586]">
        {label}
      </p>

      <div className="my-1.5">
        <p className="text-2xl font-bold tracking-tight text-[#17202F] tabular-nums">
          {currency ? <span className="font-semibold text-[20px] mr-1 text-[#697586]">{currency}</span> : null}
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        {hasDelta ? (
          <>
            <span
              className={cn(
                'font-semibold tabular-nums',
                isPositive ? 'text-emerald-700' : isNegative ? 'text-rose-600' : 'text-[#697586]'
              )}
            >
              {isPositive ? '↑ +' : isNegative ? '↓ ' : ''}
              {Math.abs(deltaPct)}%
            </span>
            <span className="text-[#9CA3AF] text-[11px] truncate">
              {periodLabel}
            </span>
          </>
        ) : (
          <span className="text-[11px] text-[#9CA3AF]">Current period</span>
        )}
      </div>
    </div>
  );
}
