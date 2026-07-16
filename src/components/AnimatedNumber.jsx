import { useEffect } from 'react'
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion'

/**
 * Smoothly interpolates to `value` and renders with fixed decimals + tabular
 * numerals. Used for the pot, seed, distributed totals, etc.
 */
export default function AnimatedNumber({
  value,
  decimals = 2,
  className = '',
  prefix = '',
  suffix = '',
}) {
  const mv = useMotionValue(value)
  const spring = useSpring(mv, { stiffness: 90, damping: 20, mass: 0.6 })
  const text = useTransform(spring, (v) =>
    `${prefix}${Number(v).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}${suffix}`,
  )

  useEffect(() => {
    mv.set(value)
  }, [value, mv])

  return <motion.span className={`tnum ${className}`}>{text}</motion.span>
}
