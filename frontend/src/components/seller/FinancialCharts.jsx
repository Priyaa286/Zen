import { useState } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Layers, Eye } from 'lucide-react';
import { cn } from '@/utils/cn';

export function SalesPerformanceChart({
  timeline: propTimeline,
  comparisonTimeline: propComparisonTimeline,
  analytics,
  currency = 'JPY',
  dateRange = '30d',
  onDateRangeChange,
  isLoading = false,
}) {
  const timeline = propTimeline || analytics?.timeline || [];
  const comparisonTimeline = propComparisonTimeline || analytics?.comparisonTimeline || [];
  const [showComparison, setShowComparison] = useState(true);
  const [showNetRevenue, setShowNetRevenue] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-subtle min-h-[360px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-[#697586] text-xs">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#465BE5] border-t-transparent" />
          <span>Updating sales performance...</span>
        </div>
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-subtle min-h-[360px] flex flex-col items-center justify-center text-center">
        <p className="text-sm font-semibold text-[#17202F]">No sales recorded in this period</p>
        <p className="text-xs text-[#697586] mt-1 max-w-sm">
          Try expanding your date range filter to view historical performance trends.
        </p>
      </div>
    );
  }

  const padding = { top: 25, right: 25, bottom: 35, left: 60 };
  const width = 840;
  const height = 300;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Compute scale boundaries
  const allValues = [
    ...timeline.map((d) => d.grossSales || 0),
    ...(showComparison ? comparisonTimeline.map((d) => d.grossSales || 0) : []),
    ...(showNetRevenue ? timeline.map((d) => d.netRevenue || 0) : []),
  ];
  const maxVal = Math.max(...allValues, 100);
  const minVal = 0;

  // Compute coordinates for primary series
  const points = timeline.map((d, i) => {
    const x = padding.left + (i / Math.max(timeline.length - 1, 1)) * chartWidth;
    const yGross = padding.top + chartHeight - ((d.grossSales - minVal) / (maxVal - minVal)) * chartHeight;
    const yNet = padding.top + chartHeight - (((d.netRevenue || d.grossSales * 0.92) - minVal) / (maxVal - minVal)) * chartHeight;
    return { ...d, x, yGross, yNet };
  });

  // Compute coordinates for comparison series (dotted line)
  const compPoints = comparisonTimeline.map((d, i) => {
    const x = padding.left + (i / Math.max(comparisonTimeline.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.grossSales - minVal) / (maxVal - minVal)) * chartHeight;
    return { ...d, x, y };
  });

  // SVG paths
  const grossLinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yGross.toFixed(1)}`).join(' ');
  const grossAreaPath = `${grossLinePath} L ${points[points.length - 1].x.toFixed(1)} ${padding.top + chartHeight} L ${points[0].x.toFixed(1)} ${padding.top + chartHeight} Z`;

  const netLinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yNet.toFixed(1)}`).join(' ');

  const compLinePath = compPoints.length > 0
    ? compPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    : '';

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;
  const activeCompPoint = hoveredIdx !== null && compPoints[hoveredIdx] ? compPoints[hoveredIdx] : null;

  const totalGross = timeline.reduce((s, p) => s + (p.grossSales || 0), 0);
  const totalCompGross = comparisonTimeline.reduce((s, p) => s + (p.grossSales || 0), 0);
  const growthPct = totalCompGross > 0
    ? Number((((totalGross - totalCompGross) / totalCompGross) * 100).toFixed(1))
    : null;

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-subtle select-none">
      {/* Header: Title, Subtitle & Interactive Controls */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-[#17202F]">Sales performance</h2>
          <p className="text-xs text-[#697586] mt-0.5">Track how your store is performing over time.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Range Selector Buttons */}
          {onDateRangeChange && (
            <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] p-0.5 text-xs font-medium">
              {[
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '90d', label: '90D' },
                { id: '12m', label: '12M' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onDateRangeChange(opt.id)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all',
                    dateRange === opt.id
                      ? 'bg-white text-[#17202F] shadow-xs'
                      : 'text-[#697586] hover:text-[#17202F]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Toggle: Compare to Previous Period */}
          {comparisonTimeline.length > 0 && (
            <button
              type="button"
              onClick={() => setShowComparison((prev) => !prev)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
                showComparison
                  ? 'border-blue-200 bg-blue-50/70 text-[#172554]'
                  : 'border-[#E5E7EB] bg-white text-[#697586] hover:bg-[#F7F8FA]'
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#697586]" />
              <span>Compare previous</span>
            </button>
          )}

          {/* Toggle: Net Revenue */}
          <button
            type="button"
            onClick={() => setShowNetRevenue((prev) => !prev)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
              showNetRevenue
                ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800'
                : 'border-[#E5E7EB] bg-white text-[#697586] hover:bg-[#F7F8FA]'
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Net revenue</span>
          </button>
        </div>
      </div>

      {/* Chart Legend Summary */}
      <div className="flex flex-wrap items-center gap-5 pt-3 pb-2 text-xs text-[#697586]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-4 rounded-xs bg-[#465BE5]" />
          <span className="font-medium text-[#17202F]">Gross Sales:</span>
          <span className="font-bold text-[#17202F] tabular-nums">
            {currency} {totalGross.toLocaleString()}
          </span>
        </div>

        {showComparison && comparisonTimeline.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-4 border-t-2 border-dashed border-[#9CA3AF]" />
            <span className="text-[#697586]">Previous Period:</span>
            <span className="font-medium text-[#697586] tabular-nums">
              {currency} {totalCompGross.toLocaleString()}
            </span>
            {growthPct !== null && (
              <span className={cn('font-semibold tabular-nums text-[11px]', growthPct >= 0 ? 'text-emerald-700' : 'text-rose-600')}>
                ({growthPct >= 0 ? '+' : ''}{growthPct}%)
              </span>
            )}
          </div>
        )}

        {showNetRevenue && (
          <div className="flex items-center gap-2">
            <span className="h-2 w-4 rounded-xs bg-emerald-500" />
            <span className="text-emerald-900 font-medium">Net Disbursable:</span>
            <span className="font-bold text-emerald-900 tabular-nums">
              {currency} {timeline.reduce((s, p) => s + (p.netRevenue || p.grossSales * 0.92), 0).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Responsive SVG Chart Canvas */}
      <div className="relative w-full pt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#465BE5" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#465BE5" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="netRevGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines with value labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + chartHeight * (1 - pct);
            const val = Math.round(minVal + (maxVal - minVal) * pct);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#F3F4F6"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="11"
                  fill="#9CA3AF"
                  className="font-mono tabular-nums"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                </text>
              </g>
            );
          })}

          {/* Comparison Series (Dotted gray line) */}
          {showComparison && compLinePath && (
            <path
              d={compLinePath}
              fill="none"
              stroke="#9CA3AF"
              strokeWidth="1.8"
              strokeDasharray="4 3"
              strokeLinecap="round"
            />
          )}

          {/* Primary Gross Sales Area & Line */}
          <path d={grossAreaPath} fill="url(#salesGradient)" />
          <path
            d={grossLinePath}
            fill="none"
            stroke="#465BE5"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Optional Net Revenue Line */}
          {showNetRevenue && (
            <path
              d={netLinePath}
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Hover Crosshair & Dots */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={padding.top}
                x2={activePoint.x}
                y2={padding.top + chartHeight}
                stroke="#697586"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.yGross}
                r="5"
                fill="#465BE5"
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />
              {activeCompPoint && showComparison && (
                <circle
                  cx={activePoint.x}
                  cy={activeCompPoint.y}
                  r="4"
                  fill="#9CA3AF"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              )}
              {showNetRevenue && (
                <circle
                  cx={activePoint.x}
                  cy={activePoint.yNet}
                  r="4.5"
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              )}
            </g>
          )}

          {/* Interactive Invisible Hover Columns */}
          {points.map((p, i) => {
            const colWidth = chartWidth / points.length;
            return (
              <rect
                key={i}
                x={p.x - colWidth / 2}
                y={padding.top}
                width={colWidth}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(i)}
                className="cursor-pointer"
              />
            );
          })}

          {/* X Axis Date Labels */}
          {points.map((p, i) => {
            if (points.length > 8 && i % 2 !== 0 && i !== points.length - 1) return null;
            return (
              <text
                key={i}
                x={p.x}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                fontSize="11"
                fill={hoveredIdx === i ? '#17202F' : '#697586'}
                fontWeight={hoveredIdx === i ? '600' : '400'}
              >
                {p.label || p.date}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {activePoint && (
          <div
            className="pointer-events-none absolute z-30 rounded-xl border border-[#E5E7EB] bg-white/98 p-3 shadow-elevated backdrop-blur-sm transition-all"
            style={{
              left: Math.min(Math.max(activePoint.x - 80, 10), width - 170),
              top: Math.max(activePoint.yGross - 80, 10),
            }}
          >
            <p className="text-xs font-bold text-[#17202F] border-b border-gray-100 pb-1">
              {activePoint.date}
            </p>
            <div className="mt-1.5 space-y-1 text-xs tabular-nums">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#697586]">Gross Sales:</span>
                <span className="font-bold text-[#465BE5]">
                  {currency} {activePoint.grossSales.toLocaleString()}
                </span>
              </div>
              {showComparison && activeCompPoint && (
                <div className="flex items-center justify-between gap-4 text-[#9CA3AF] text-[11px]">
                  <span>Prior Period:</span>
                  <span className="font-medium">
                    {currency} {activeCompPoint.grossSales.toLocaleString()}
                  </span>
                </div>
              )}
              {showNetRevenue && (
                <div className="flex items-center justify-between gap-4 text-emerald-800 text-[11px]">
                  <span>Net Revenue:</span>
                  <span className="font-semibold">
                    {currency} {(activePoint.netRevenue || Math.round(activePoint.grossSales * 0.92)).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 text-[#697586] text-[11px] pt-0.5 border-t border-gray-100">
                <span>Orders:</span>
                <span className="font-semibold text-[#17202F]">{activePoint.orders}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function RevenueAreaChart({ data = [], currency = 'JPY', height = 260 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-[#697586]"
      >
        No timeseries data available.
      </div>
    );
  }

  const width = 680;
  const padding = { top: 20, right: 20, bottom: 30, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.grossSales || 0), 100);
  const minVal = 0;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const yGross = padding.top + chartHeight - ((d.grossSales - minVal) / (maxVal - minVal)) * chartHeight;
    const yNet = padding.top + chartHeight - (((d.netRevenue || d.grossSales * 0.92) - minVal) / (maxVal - minVal)) * chartHeight;
    return { ...d, x, yGross, yNet };
  });

  const grossPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yGross.toFixed(1)}`).join(' ');
  const areaPath = `${grossPath} L ${points[points.length - 1].x.toFixed(1)} ${padding.top + chartHeight} L ${points[0].x.toFixed(1)} ${padding.top + chartHeight} Z`;
  const netPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yNet.toFixed(1)}`).join(' ');

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="relative w-full select-none" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="areaGradientGross" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#465BE5" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#465BE5" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = padding.top + chartHeight * (1 - r);
          const val = Math.round(minVal + (maxVal - minVal) * r);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#F1F3F6"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="#9CA3AF"
              >
                {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        <path d={areaPath} fill="url(#areaGradientGross)" />

        {/* Net Line */}
        <path d={netPath} fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="4 3" />

        {/* Gross Line */}
        <path d={grossPath} fill="none" stroke="#465BE5" strokeWidth="2.5" />

        {/* Interaction trigger zones */}
        {points.map((p, i) => (
          <g key={i}>
            <rect
              x={p.x - chartWidth / (points.length * 2)}
              y={padding.top}
              width={chartWidth / points.length}
              height={chartHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
            {hoveredIdx === i && (
              <>
                <line
                  x1={p.x}
                  y1={padding.top}
                  x2={p.x}
                  y2={padding.top + chartHeight}
                  stroke="#465BE5"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle cx={p.x} cy={p.yGross} r="4.5" fill="#465BE5" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx={p.x} cy={p.yNet} r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
              </>
            )}
          </g>
        ))}
      </svg>

      {/* Floating Tooltip */}
      {activePoint && (
        <div
          className="pointer-events-none absolute z-30 rounded-lg border border-[#E5E7EB] bg-white p-2.5 shadow-elevated text-xs tabular-nums"
          style={{
            left: Math.min(Math.max(activePoint.x - 70, 10), width - 150),
            top: Math.max(activePoint.yGross - 65, 5),
          }}
        >
          <div className="font-semibold text-[#17202F] pb-1 border-b border-gray-100">
            {activePoint.date}
          </div>
          <div className="mt-1 flex items-center justify-between gap-3 text-[#465BE5]">
            <span>Gross:</span>
            <span className="font-bold">{currency} {activePoint.grossSales.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-emerald-700">
            <span>Net:</span>
            <span className="font-semibold">{currency} {(activePoint.netRevenue || Math.round(activePoint.grossSales * 0.92)).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderVolumeBarChart({ data = [], height = 220, barColor = '#465BE5' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-[#697586]"
      >
        No order volume recorded.
      </div>
    );
  }

  const width = 340;
  const padding = { top: 20, right: 15, bottom: 30, left: 35 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxOrders = Math.max(...data.map((d) => d.orders || 0), 5);
  const barWidth = Math.max(8, Math.min(22, (chartWidth / data.length) * 0.65));

  const bars = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const bHeight = ((d.orders || 0) / maxOrders) * chartHeight;
    const y = padding.top + chartHeight - bHeight;
    return { ...d, x, y, bHeight };
  });

  const activeBar = hoveredIdx !== null ? bars[hoveredIdx] : null;

  return (
    <div className="relative w-full select-none" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        {/* Horizontal gridlines */}
        {[0, 0.5, 1].map((r, i) => {
          const y = padding.top + chartHeight * (1 - r);
          const val = Math.round(maxOrders * r);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#F1F3F6"
                strokeDasharray="2 2"
              />
              <text
                x={padding.left - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="9.5"
                fill="#9CA3AF"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {bars.map((b, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <rect
                x={b.x - barWidth / 2}
                y={b.y}
                width={barWidth}
                height={Math.max(b.bHeight, 2)}
                rx="3"
                fill={isHovered ? '#1D4ED8' : barColor}
                opacity={isHovered ? 1 : 0.85}
                className="transition-colors"
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {activeBar && (
        <div
          className="pointer-events-none absolute z-30 rounded-lg border border-[#E5E7EB] bg-white p-2 shadow-elevated text-xs tabular-nums"
          style={{
            left: Math.min(Math.max(activeBar.x - 40, 5), width - 90),
            top: Math.max(activeBar.y - 45, 5),
          }}
        >
          <div className="font-semibold text-[#17202F] text-[11px]">{activeBar.date}</div>
          <div className="text-[#465BE5] font-bold text-xs">{activeBar.orders} orders</div>
        </div>
      )}
    </div>
  );
}
