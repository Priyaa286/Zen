import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium leading-4 transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#151923] text-white',
        secondary: 'border-[#E6E5E0] bg-[#F8F7F4] text-[#454954]',
        outline: 'border-[#E6E5E0] bg-white text-[#747987]',
        info: 'border-[#465BE6]/25 bg-[#465BE6]/[0.06] text-[#465BE6]',
        accent: 'border-[#465BE6]/25 bg-[#465BE6]/[0.06] text-[#465BE6]',
        success: 'border-[#168B66]/25 bg-[#168B66]/[0.08] text-[#168B66]',
        warning: 'border-[#C98A1C]/30 bg-[#C98A1C]/[0.08] text-[#9A6A13]',
        destructive: 'border-red-200 bg-red-50 text-red-700',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  }
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
