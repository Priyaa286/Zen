import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Hook to detect reduced motion preference
 */
export function usePrefersReducedMotion() {
  const shouldReduce = useReducedMotion();
  const [prefersReduced, setPrefersReduced] = useState(Boolean(shouldReduce));

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    const listener = (event) => setPrefersReduced(event.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return Boolean(shouldReduce || prefersReduced);
}

/**
 * Filter animation variants for reduced-motion users:
 * Strips x, y, scale transformations, keeping only clean instantaneous or linear opacity.
 */
export function getSafeVariant(variant, prefersReduced = false) {
  if (!prefersReduced || !variant) return variant;

  const safe = {};
  for (const [key, val] of Object.entries(variant)) {
    if (typeof val === 'object' && val !== null) {
      safe[key] = {
        ...val,
        x: 0,
        y: 0,
        scale: 1,
        transition: { duration: 0.01 },
      };
    } else {
      safe[key] = val;
    }
  }
  return safe;
}

