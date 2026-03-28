// Shared Framer Motion variants for consistent scroll animations across all pages.
// Usage: import { scrollFadeUp, scrollStagger, scrollTransition, scrollViewport } from '../utils/motionVariants';

export const scrollFadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const scrollStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

export const scrollTransition = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1],
};

export const scrollViewport = {
  once: true,
  margin: '-80px',
};
