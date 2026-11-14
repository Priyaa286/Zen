import { motion } from 'framer-motion';
import { fadeInVariants } from '@/animations/variants';
import { usePrefersReducedMotion } from '@/animations/animationUtils';

export function FadeIn({
  children,
  direction = 'up',
  delay = 0,
  duration,
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

  const customTransition = {
    duration: duration || 0.28,
    delay,
    ease: [0.22, 1, 0.36, 1],
  };

  return (
    <MotionComponent
      custom={direction}
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
      transition={customTransition}
      className={className}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}

export default FadeIn;

