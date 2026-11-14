import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { usePrefersReducedMotion } from '@/animations/animationUtils';
import { cn } from '@/utils/cn';

export function MotionButton({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const prefersReduced = usePrefersReducedMotion();

  const variantStyles = {
    primary:
      'bg-[#172554] text-white hover:bg-[#1E3A8A] active:bg-[#0F172A] border-transparent',
    secondary:
      'bg-[#465BE5] text-white hover:bg-[#3B4ECB] active:bg-[#3140A8] border-transparent',
    outline:
      'border-[#E5E7EB] bg-white text-[#17202F] hover:bg-[#F7F8FA] hover:border-[#CBD5E1]',
    ghost:
      'bg-transparent text-[#697586] hover:bg-[#F1F3F6] hover:text-[#17202F] border-transparent',
    danger:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border-transparent',
  };

  const sizeStyles = {
    xs: 'h-7 px-2.5 text-[11.5px]',
    sm: 'h-8 px-3 text-[12px]',
    md: 'h-9 px-4 text-[13px]',
    lg: 'h-11 px-5 text-[14px]',
  };

  const combinedClasses = cn(
    'relative inline-flex items-center justify-center gap-2 rounded-lg border font-[600] transition-colors focus:outline-none focus:ring-2 focus:ring-[#465BE5]/20 disabled:pointer-events-none disabled:opacity-50 select-none',
    variantStyles[variant] || variantStyles.primary,
    sizeStyles[size] || sizeStyles.md,
    className
  );

  if (prefersReduced) {
    return (
      <button
        type={type}
        disabled={disabled || isLoading}
        onClick={onClick}
        className={combinedClasses}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className={combinedClasses}
      {...props}
    >
      {isLoading && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="inline-flex shrink-0"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
        </motion.span>
      )}
      {children}
    </motion.button>
  );
}

export default MotionButton;

