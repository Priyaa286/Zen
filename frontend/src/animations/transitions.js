import {
  MOTION_DURATIONS,
  MOTION_EASINGS,
  MOTION_SPRINGS,
} from './motionConfig';

export const fadeTransition = {
  duration: MOTION_DURATIONS.component,
  ease: MOTION_EASINGS.default,
};

export const slideUpTransition = {
  duration: MOTION_DURATIONS.component,
  ease: MOTION_EASINGS.default,
};

export const drawerTransition = {
  duration: MOTION_DURATIONS.drawer,
  ease: MOTION_EASINGS.default,
};

export const modalTransition = {
  duration: MOTION_DURATIONS.component,
  ease: MOTION_EASINGS.default,
};

export const pageTransition = {
  duration: MOTION_DURATIONS.page,
  ease: MOTION_EASINGS.default,
};

export const springSubtleTransition = MOTION_SPRINGS.subtle;
export const springSnappyTransition = MOTION_SPRINGS.snappy;

