/**
 * Shared Motion Tokens and Timing Configurations for Zen Global
 * Inspired by Apple, Stripe, and Linear interface design philosophies:
 * Subtle, restrained, high-performance, and fully respecting accessibility.
 */

export const MOTION_DURATIONS = {
  instant: 0.1,
  micro: 0.18,       // 180ms: button presses, toggles, badge ticks
  component: 0.28,   // 280ms: dropdowns, tooltips, cards
  drawer: 0.35,      // 350ms: side sheets, search drawers, modals
  page: 0.38,        // 380ms: route transitions
  carousel: 0.45,    // 450ms: carousel snaps
};

export const MOTION_EASINGS = {
  // Apple / Stripe signature smooth decelerate
  default: [0.22, 1, 0.36, 1],
  // Snappy enter
  enter: [0.16, 1, 0.3, 1],
  // Smooth exit
  exit: [0.4, 0, 0.7, 0.2],
  // Standard in-out
  easeInOut: [0.45, 0, 0.55, 1],
};

export const MOTION_SPRINGS = {
  subtle: { type: 'spring', stiffness: 450, damping: 32, mass: 0.8 },
  snappy: { type: 'spring', stiffness: 400, damping: 28 },
  gentle: { type: 'spring', stiffness: 300, damping: 30 },
  bounce: { type: 'spring', stiffness: 420, damping: 20 },
};

export const REDUCED_MOTION_TRANSITION = {
  duration: 0.01,
  ease: 'linear',
};

