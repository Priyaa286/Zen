import {
  MOTION_DURATIONS,
  MOTION_EASINGS,
  MOTION_SPRINGS,
} from './motionConfig';

/**
 * Route page transition variants:
 * Gentle opacity + subtle 8px vertical rise to prevent jarring layout jumps.
 */
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.page,
      ease: MOTION_EASINGS.default,
      when: 'beforeChildren',
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.22,
      ease: MOTION_EASINGS.exit,
    },
  },
};

/**
 * Fade In With Direction
 */
export const fadeInVariants = {
  hidden: (direction = 'up') => {
    switch (direction) {
      case 'up':
        return { opacity: 0, y: 16 };
      case 'down':
        return { opacity: 0, y: -16 };
      case 'left':
        return { opacity: 0, x: 16 };
      case 'right':
        return { opacity: 0, x: -16 };
      default:
        return { opacity: 0 };
    }
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.component,
      ease: MOTION_EASINGS.default,
    },
  },
};

/**
 * Stagger Container & Items
 */
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: (custom = {}) => ({
    opacity: 1,
    transition: {
      staggerChildren: custom.stagger || 0.05,
      delayChildren: custom.delay || 0.04,
    },
  }),
};

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.component,
      ease: MOTION_EASINGS.default,
    },
  },
};

/**
 * Dropdowns & Menus
 */
export const dropdownVariants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: -4,
    transformOrigin: 'top right',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.default,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -3,
    transition: {
      duration: 0.15,
      ease: MOTION_EASINGS.exit,
    },
  },
};

/**
 * Modals & Dialogs
 */
export const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: MOTION_DURATIONS.component, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export const modalContentVariants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.drawer,
      ease: MOTION_EASINGS.default,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: {
      duration: 0.18,
      ease: MOTION_EASINGS.exit,
    },
  },
};

/**
 * Side Drawers (Cart, Filter, Mobile Menu)
 */
export const drawerSlideRightVariants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: {
      duration: MOTION_DURATIONS.drawer,
      ease: MOTION_EASINGS.default,
    },
  },
  exit: {
    x: '100%',
    transition: {
      duration: 0.25,
      ease: MOTION_EASINGS.exit,
    },
  },
};

export const drawerSlideDownVariants = {
  hidden: { y: '-100%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: MOTION_DURATIONS.drawer,
      ease: MOTION_EASINGS.default,
    },
  },
  exit: {
    y: '-100%',
    opacity: 0,
    transition: {
      duration: 0.22,
      ease: MOTION_EASINGS.exit,
    },
  },
};

/**
 * Product Card Micro-Interactions
 */
export const cardElevationVariants = {
  rest: { y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  hover: { y: -3, transition: { duration: 0.25, ease: MOTION_EASINGS.default } },
};

/**
 * Micro-Interaction Heart / Cart Activation
 */
export const iconPulseVariants = {
  rest: { scale: 1 },
  tap: { scale: 0.85 },
  active: {
    scale: [1, 1.28, 1],
    transition: { duration: 0.35, ease: MOTION_EASINGS.default },
  },
};

