import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';

export function ErrorMessage({
  title = "That didn't work",
  message = "We couldn't finish that request. Please try again.",
  onRetry,
  retryLabel = 'Try again',
  className,
  action,
}) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-red-200 bg-red-50/70 p-4 text-[#151923]',
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-600">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-semibold text-red-950">{title}</h4>
            <p className="text-xs leading-relaxed text-red-800">{message}</p>
          </div>
        </div>
        {(onRetry || action) && (
          <div className="flex shrink-0 items-center gap-2 sm:pl-4">
            {action}
            {onRetry && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="border-red-200 bg-white text-red-700 hover:bg-red-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {retryLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
