import { AnimatePresence, motion } from 'framer-motion'
import { Trophy, ArrowUpRight } from 'iconoir-react'
import { container, item, reveal } from '../lib/motion'
import { Eyebrow, LiveDot } from './ui'

export default function Winners({ round }) {
  return (
    <section id="winners" className="mx-auto max-w-6xl px-5 pt-28">
      <motion.div variants={container(0.08)} {...reveal(0.15)}>
        <motion.div variants={item} className="mb-8 flex items-end justify-between gap-4">
          <div>
            <Eyebrow>Paid out, on-chain</Eyebrow>
            <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">
              Recent robberies
            </h2>
          </div>
          <span className="hidden items-center gap-2 font-mono text-xs uppercase tracking-widest text-vermilion sm:flex">
            <LiveDot /> updates live
          </span>
        </motion.div>

        <motion.div variants={item} className="overflow-hidden rounded-xl2 border border-line bg-surface/70 shadow-card">
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-line px-6 py-3 font-mono text-[0.68rem] uppercase tracking-widest text-ink-soft sm:grid-cols-[1.2fr_1fr_1fr_auto]">
            <span>Winner</span>
            <span className="hidden sm:block">Round</span>
            <span className="hidden text-right sm:block">When</span>
            <span className="text-right">Prize</span>
          </div>

          <AnimatePresence initial={false}>
            {round.winners.map((w, i) => (
              <motion.a
                key={`${w.round}-${w.addr}`}
                layout
                href="#"
                initial={{ opacity: 0, y: -14, backgroundColor: 'rgba(213,68,42,0.12)' }}
                animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(0,0,0,0)' }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={`grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-5 transition-colors hover:bg-paper/50 sm:grid-cols-[1.2fr_1fr_1fr_auto] ${
                  i !== round.winners.length - 1 ? 'border-b border-line' : ''
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/15 text-gold">
                    <Trophy width={17} height={17} />
                  </span>
                  <span className="font-mono text-base text-ink sm:text-lg">{w.addr}</span>
                </span>
                <span className="hidden font-mono text-ink-soft sm:block">#{w.round}</span>
                <span className="hidden text-right font-mono text-ink-soft sm:block">
                  {w.ago === 'now' ? 'just now' : `${w.ago} ago`}
                </span>
                <span className="flex items-center justify-end gap-1 font-display text-2xl font-extrabold tracking-tight text-sage sm:text-3xl">
                  <span className="tnum">+{w.prize}</span>
                  <span className="text-base font-bold text-clay">ETH</span>
                  <ArrowUpRight width={18} height={18} className="text-ink-soft" />
                </span>
              </motion.a>
            ))}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </section>
  )
}
