import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button as UiButton } from '@/components/ui/button';

const Button = React.forwardRef(
  ({ isLoading = false, loadingText, children, disabled, ...props }, ref) => {
    return (
      <UiButton ref={ref} disabled={disabled || isLoading} {...props}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{loadingText || children}</span>
          </>
        ) : (
          children
        )}
      </UiButton>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
