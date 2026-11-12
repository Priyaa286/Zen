import { motion } from 'framer-motion';
import {
  staggerContainerVariants,
  staggerItemVariants,
} from '@/animations/variants';
import { usePrefersReducedMotion } from '@/animations/animationUtils';

export function StaggerContainer({
  children,
  stagger = 0.05,
  delay = 0.04,
  amount = 0.1,
  className = '',
  as = 'div',
  ...props
}) {
  const prefersReduced = usePrefersReducedMotion();
  const MotionComponent = motion[as] || motion.div;

  if (prefersReduced) {
    const Component = as;
    return <Component className={className}>{children}</Component>;
  }

  return (
    <MotionComponent
      variants={staggerContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      custom={{ stagger, delay }}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}

export function StaggerItem({
  children,
  className = '',
  as = 'div',
  ...props
}) {
  const prefersReduced = usePrefersReducedMotion();
  const MotionComponent = motion[as] || motion.div;

  if (prefersReduced) {
    const Component = as;
    return <Component className={className}>{children}</Component>;
  }

  return (
    <MotionComponent
      variants={staggerItemVariants}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}

export default StaggerContainer;

