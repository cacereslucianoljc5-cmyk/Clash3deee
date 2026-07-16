import { motion } from 'framer-motion'
import { HandCash, Bank, Trophy, Hourglass, Flash } from 'iconoir-react'
import { container, slideL, item, reveal } from '../lib/motion'
import { Eyebrow } from './ui'

const STEPS = [
  { icon: HandCash, k: 'Trade', d: 'Every buy & sell pays a 10% tax, taken in the token itself.' },
  { icon: Bank, k: 'Pot fills', d: '8% flows to the ETH pot, 2% seeds the next round so it never starts empty.' },
  { icon: Trophy, k: 'Get a ticket', d: 'Buy ≥ ~$30 and you hold one ticket. One per wallet — whales get no edge.' },
  { icon: Hourglass, k: '10 minutes', d: 'The round clock runs on block time. When it expires, the round is armed.' },
  { icon: Flash, k: 'A buyer robs it all', d: 'The first trade after time is a random payout — 100% of the pot, one winner.' },
]

export default function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 pt-28">
      <motion.div variants={container(0.08)} {...reveal(0.15)}>
        <motion.div variants={item} className="max-w-2xl">
          <Eyebrow>The heist, in five moves</Eyebrow>
          <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">
            How it works
          </h2>
          <p className="mt-5 font-serif text-2xl italic text-ink-soft">
            No staking, no lock-ups, no team wallet. Just volume, a clock, and a
            random winner.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.k}
              variants={slideL}
              className="group grid grid-cols-[auto_1fr] items-center gap-5 rounded-2xl border border-line bg-surface/70 p-5 shadow-soft transition-colors hover:border-clay/50 sm:grid-cols-[auto_auto_1fr] sm:gap-8 sm:p-7"
            >
              <span className="tnum font-display text-4xl font-extrabold text-line sm:text-6xl">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink text-paper shadow-inset transition-transform group-hover:-rotate-6 sm:h-16 sm:w-16">
                <s.icon width={26} height={26} />
              </span>
              <div>
                <h3 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {s.k}
                </h3>
                <p className="mt-1.5 max-w-xl font-sans text-lg leading-snug text-ink-soft">
                  {s.d}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
