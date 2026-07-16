import { motion } from 'framer-motion'
import { item } from '../lib/motion'

// Small eyebrow label used above section headings
export function Eyebrow({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.28em] text-clay ${className}`}
    >
      <span className="h-px w-6 bg-clay/50" />
      {children}
    </span>
  )
}

// Reusable animated child — rises in when its parent container reveals
export function Rise({ children, className = '', as = 'div', variants = item }) {
  const M = motion[as] || motion.div
  return (
    <M variants={variants} className={className}>
      {children}
    </M>
  )
}

// Pill / chip
export function Pill({ children, tone = 'clay', className = '' }) {
  const tones = {
    clay: 'bg-clay/10 text-clay border-clay/25',
    gold: 'bg-gold/12 text-gold border-gold/30',
    vermilion: 'bg-vermilion/10 text-vermilion border-vermilion/25',
    ink: 'bg-ink/[0.06] text-ink-soft border-ink/10',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

// Live "on-air" dot
export function LiveDot({ className = '' }) {
  return (
    <span className={`relative flex h-2.5 w-2.5 ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vermilion/70" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-vermilion" />
    </span>
  )
}
