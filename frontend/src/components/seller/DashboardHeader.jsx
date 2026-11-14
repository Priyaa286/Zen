import { Link } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRangeSelector } from './DateRangeSelector';
import { downloadSellerReportCsv } from '@/services/sellerService';
import { useToast } from '@/context/ToastContext';

export function DashboardHeader({
  title = 'Overview',
  dateRange = '30d',
  onDateRangeChange,
  analytics,
}) {
  const { showToast } = useToast();

  const handleExportSummary = () => {
    try {
      downloadSellerReportCsv(
        'summary',
        {
          dateRange,
          analytics,
        },
        `zen_merchant_summary_${Date.now()}.csv`
      );
      showToast({
        title: 'Report Downloaded',
        description: 'Exported merchant executive summary as CSV.',
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-white px-5 py-3.5 shadow-subtle">
      {/* Left: Page Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#17202F]">
          {title}
        </h1>
      </div>

      {/* Right: Action Controls on a single row */}
      <div className="flex flex-wrap items-center gap-2.5">
        <DateRangeSelector value={dateRange} onChange={onDateRangeChange} />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportSummary}
          className="h-9 gap-1.5 text-xs font-medium text-[#17202F] hover:bg-[#F7F8FA]"
        >
          <Download className="h-3.5 w-3.5 text-[#697586]" />
          <span>Export</span>
        </Button>

        <Button
          asChild
          size="sm"
          className="h-9 gap-1.5 bg-[#172554] text-xs font-semibold text-white shadow-xs hover:bg-[#1E3A8A]"
        >
          <Link to="/seller/products/new">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Product</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
