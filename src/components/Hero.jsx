import { motion } from 'framer-motion'
import { Flash, ArrowRight, Timer, Coins } from 'iconoir-react'
import { container, item, clipUp, reveal } from '../lib/motion'
import { Pill, LiveDot } from './ui'

const HEAD_1 = ['Rob', 'the', 'whales.']
const HEAD_2 = ['Feed', 'the', 'degens.']

function Word({ children, accent }) {
  return (
    <span className="mr-[0.28em] inline-block overflow-hidden pb-[0.06em] align-bottom">
      <motion.span
        variants={clipUp}
        className={`inline-block ${accent ? 'text-vermilion' : ''}`}
      >
        {children}
      </motion.span>
    </span>
  )
}

export default function Hero({ round }) {
  return (
    <section id="top" className="relative mx-auto max-w-6xl px-5 pt-16 sm:pt-24">
      <motion.div
        variants={container(0.06)}
        {...reveal(0.2)}
        className="flex flex-col items-start"
      >
        <motion.div variants={item}>
          <Pill tone="vermilion" className="mb-6">
            <LiveDot className="mr-1" />
            Round #{round.round} live · a buyer robs it every 10 min
          </Pill>
        </motion.div>

        {/* Massive display headline, word by word */}
        <h1 className="font-display text-[clamp(2.9rem,9vw,7.5rem)] font-extrabold leading-[0.92] tracking-tight text-ink">
          <span className="block">
            {HEAD_1.map((w) => (
              <Word key={w}>{w}</Word>
            ))}
          </span>
          <span className="block">
            {HEAD_2.map((w, i) => (
              <Word key={w} accent={i === 0}>
                {w}
              </Word>
            ))}
          </span>
        </h1>

        <motion.p
          variants={item}
          className="mt-7 max-w-2xl font-serif text-2xl italic leading-snug text-ink-soft sm:text-[1.7rem]"
        >
          ROGUE is a 10-minute on-chain lottery. You trade, the tax fills the
          pot, and every 10 minutes a random buyer{' '}
          <span className="text-ink not-italic">robs it all.</span>
        </motion.p>

        <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-4">
          <a
            href="#buy"
            className="group inline-flex items-center gap-2.5 rounded-full bg-vermilion px-7 py-3.5 font-sans text-lg font-semibold text-paper shadow-card transition-all hover:bg-ink active:scale-[0.98]"
          >
            <Coins width={20} height={20} />
            Buy $ROGUE
            <ArrowRight
              width={20}
              height={20}
              className="transition-transform group-hover:translate-x-1"
            />
          </a>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-6 py-3.5 font-sans text-lg font-medium text-ink transition-colors hover:border-ink/40"
          >
            <Flash width={18} height={18} className="text-gold" />
            How the heist works
          </a>
        </motion.div>

        {/* Trust row — big, visible numbers */}
        <motion.div
          variants={item}
          className="mt-14 grid w-full grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-9 sm:grid-cols-4"
        >
          <HeroStat icon={<Coins width={16} height={16} />} k="128.47 ETH" v="paid to buyers" />
          <HeroStat icon={<Timer width={16} height={16} />} k="10 min" v="every round" />
          <HeroStat k="100%" v="of the pot, always" />
          <HeroStat k="42" v="rounds & counting" />
        </motion.div>
      </motion.div>
    </section>
  )
}

function HeroStat({ icon, k, v }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        {icon && <span className="text-clay">{icon}</span>}
        <span className="tnum">{k}</span>
      </div>
      <div className="mt-1 font-mono text-[0.72rem] uppercase tracking-widest text-ink-soft">
        {v}
      </div>
    </div>
  )
}
