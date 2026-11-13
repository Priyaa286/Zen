import { motion } from 'framer-motion';
import { pageVariants } from '@/animations/variants';
import { usePrefersReducedMotion } from '@/animations/animationUtils';

export function PageTransition({ children, className = '' }) {
  const prefersReduced = usePrefersReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;

