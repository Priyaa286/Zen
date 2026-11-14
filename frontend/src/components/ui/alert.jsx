import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const alertVariants = cva(
  'relative w-full rounded-md border px-4 py-3 text-sm flex items-start gap-3',
  {
    variants: {
      variant: {
        default: 'border-[#E6E5E0] bg-[#F8F7F4] text-[#151923]',
        info: 'border-[#465BE6]/25 bg-[#465BE6]/[0.05] text-[#151923]',
        warning: 'border-[#C98A1C]/30 bg-[#C98A1C]/[0.07] text-[#151923]',
        destructive: 'border-red-200 bg-red-50/70 text-red-950',
        success: 'border-[#168B66]/25 bg-[#168B66]/[0.07] text-[#151923]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn('text-xs font-semibold leading-snug tracking-tight', className)} {...props} />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mt-0.5 text-xs leading-relaxed text-[#747987]', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
