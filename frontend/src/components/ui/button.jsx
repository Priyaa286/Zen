import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[13.5px] font-[550] tracking-[-0.01em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#465BE6]/30 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px',
  {
    variants: {
      variant: {
        default:
          'bg-[#151923] text-white hover:bg-[#232836]',
        primary:
          'bg-[#465BE6] text-white hover:bg-[#3549CC]',
        secondary:
          'bg-[#EFECE6] text-[#151923] hover:bg-[#E6E5E0]',
        outline:
          'border border-[#E6E5E0] bg-white text-[#151923] hover:border-[#D0CEC6] hover:bg-[#F8F7F4]',
        ghost:
          'text-[#747987] hover:bg-[#EFECE6]/70 hover:text-[#151923]',
        destructive:
          'bg-red-600 text-white hover:bg-red-700',
        link:
          'text-[#465BE6] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-6 text-[14px] font-[560]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
