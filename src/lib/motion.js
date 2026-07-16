// Shared Framer Motion variants — every element gets an entry animation.
// A parent uses `container` (staggers children); each child uses `item`.

const EASE = [0.22, 1, 0.36, 1]

export const container = (stagger = 0.09, delayChildren = 0.04) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
})

// Rises up + fades in
export const item = {
  hidden: { opacity: 0, y: 26, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: EASE },
  },
}

// Subtle scale-in for cards / stat tiles
export const pop = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.72, ease: EASE },
  },
}

// Slide from the left (for list rows / steps)
export const slideL = {
  hidden: { opacity: 0, x: -28 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
}

// Wipe/clip reveal for big display headings
export const clipUp = {
  hidden: { opacity: 0, y: 40, clipPath: 'inset(0 0 100% 0)' },
  show: {
    opacity: 1,
    y: 0,
    clipPath: 'inset(0 0 0% 0)',
    transition: { duration: 0.85, ease: EASE },
  },
}

// Props to spread on any section wrapper to reveal-on-scroll
export const reveal = (amount = 0.25) => ({
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, amount },
})
