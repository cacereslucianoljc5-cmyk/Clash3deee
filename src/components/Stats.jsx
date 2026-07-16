import { motion } from 'framer-motion'
import { GraphUp, Community, Timer } from 'iconoir-react'
import AnimatedNumber from './AnimatedNumber'
import { container, item, pop, reveal } from '../lib/motion'
import { Eyebrow } from './ui'

export default function Stats({ round }) {
  const usd = Math.round(round.distributed * round.ethUsd)

  return (
    <section className="mx-auto max-w-6xl px-5 pt-28">
      <motion.div
        variants={container(0.1)}
        {...reveal(0.25)}
        className="relative overflow-hidden rounded-xl2 border border-ink/10 bg-ink px-7 py-14 text-paper shadow-card sm:px-14 sm:py-20"
      >
        {/* warm glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-vermilion/20 blur-3xl" />

        <motion.div variants={item} className="relative">
          <Eyebrow className="text-gold-soft">
            <span className="h-px w-6 bg-gold-soft/50" />
            Distributed to players
          </Eyebrow>
        </motion.div>

        <motion.div variants={pop} className="relative mt-6 flex flex-wrap items-end gap-x-4 gap-y-2">
          <AnimatedNumber
            value={round.distributed}
            decimals={2}
            className="font-display text-[clamp(4rem,15vw,11rem)] font-extrabold leading-[0.85] tracking-tight text-paper"
          />
          <span className="mb-3 font-display text-4xl font-bold text-gold-soft sm:mb-5 sm:text-6xl">
            ETH
          </span>
        </motion.div>

        <motion.div variants={item} className="relative mt-4 font-mono text-xl text-paper/60 sm:text-2xl">
          ≈ ${usd.toLocaleString('en-US')} paid to random buyers
        </motion.div>

        <motion.p
          variants={item}
          className="relative mt-8 max-w-2xl font-serif text-2xl italic leading-snug text-paper/80 sm:text-3xl"
        >
          100% of every pot, paid to a random buyer — across{' '}
          <span className="text-gold-soft not-italic">{round.totalRounds} rounds.</span>
        </motion.p>

        <motion.div
          variants={item}
          className="relative mt-12 grid gap-6 border-t border-paper/15 pt-10 sm:grid-cols-3"
        >
          <MiniStat icon={<GraphUp width={18} height={18} />} k={<>{round.totalRounds}</>} v="rounds settled" />
          <MiniStat icon={<Timer width={18} height={18} />} k="10:00" v="round length" />
          <MiniStat icon={<Community width={18} height={18} />} k="1 : 1" v="odds for every wallet" />
        </motion.div>
      </motion.div>
    </section>
  )
}

function MiniStat({ icon, k, v }) {
  return (
    <div>
      <div className="flex items-center gap-2 font-display text-4xl font-extrabold tracking-tight text-paper sm:text-5xl">
        <span className="text-gold-soft">{icon}</span>
        <span className="tnum">{k}</span>
      </div>
      <div className="mt-2 font-mono text-[0.72rem] uppercase tracking-widest text-paper/50">{v}</div>
    </div>
  )
}
