import { motion } from 'framer-motion';
import { fadeInVariants } from '@/animations/variants';
import { usePrefersReducedMotion } from '@/animations/animationUtils';

export function RevealOnScroll({
  children,
  direction = 'up',
  delay = 0,
  amount = 0.12,
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
      custom={direction}
      variants={fadeInVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      transition={{
        duration: 0.32,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}

export default RevealOnScroll;

