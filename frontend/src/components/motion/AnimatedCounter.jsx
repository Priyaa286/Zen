import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrefersReducedMotion } from '@/animations/animationUtils';

export function AnimatedCounter({
  value = 0,
  className = '',
  prefix = '',
  suffix = '',
  duration = 0.35,
}) {
  const prefersReduced = usePrefersReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prefersReduced) {
      setDisplayValue(value);
      prevValue.current = value;
      return;
    }

    const startVal = prevValue.current;
    const endVal = Number(value) || 0;
    if (startVal === endVal) return;

    let startTime = null;
    let animFrame = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      } else {
        prevValue.current = endVal;
        setDisplayValue(endVal);
      }
    };

    animFrame = requestAnimationFrame(step);
    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [value, duration, prefersReduced]);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

/**
 * Animated Badge Counter (for cart/wishlist icons):
 * Performs a gentle scale pulse when the count changes!
 */
export function AnimatedBadgeCounter({ count = 0, className = '' }) {
  const prefersReduced = usePrefersReducedMotion();

  if (count <= 0) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={count}
        initial={prefersReduced ? false : { scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={prefersReduced ? false : { scale: 0.7, opacity: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className={className}
      >
        {count}
      </motion.span>
    </AnimatePresence>
  );
}

export default AnimatedCounter;

