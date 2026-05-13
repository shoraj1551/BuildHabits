export const motionTokens = {
  duration: {
    micro: 0.16,
    short: 0.24,
    medium: 0.34,
    long: 0.48,
  },
  ease: {
    standard: [0.22, 1, 0.36, 1] as const,
    swift: [0.4, 0, 0.2, 1] as const,
  },
  spring: {
    soft: { type: 'spring', stiffness: 260, damping: 24 } as const,
    snappy: { type: 'spring', stiffness: 320, damping: 28 } as const,
  },
};

