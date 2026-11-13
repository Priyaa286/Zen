import * as React from 'react';
import { cn } from '@/utils/cn';

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-[#E6E5E0] bg-white px-3.5 py-2 text-sm text-[#151923] placeholder:text-[#8F94A2] transition-colors focus-visible:border-[#465BE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#465BE6]/15 disabled:cursor-not-allowed disabled:bg-[#F8F7F4] disabled:opacity-60',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
