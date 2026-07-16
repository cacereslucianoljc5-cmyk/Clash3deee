import { AnimatePresence, motion } from 'framer-motion'
import { Timer, Community, Sparks, Flash, Coins } from 'iconoir-react'
import AnimatedNumber from './AnimatedNumber'
import { container, item, pop, reveal } from '../lib/motion'
import { Eyebrow, LiveDot } from './ui'
import { fmtClock } from '../lib/useRound'

export default function RoundBoard({ round }) {
  const pct = 1 - round.secondsLeft / round.roundSeconds
  const urgent = round.secondsLeft <= 30
  const potUsd = Math.round(round.pot * round.ethUsd).toLocaleString('en-US')

  return (
    <section id="round" className="mx-auto max-w-6xl px-5 pt-24">
      <motion.div variants={container(0.1)} {...reveal(0.15)}>
        <motion.div variants={item} className="mb-6 flex items-end justify-between gap-4">
          <div>
            <Eyebrow>Active round</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              The pot is filling right now
            </h2>
          </div>
          <span className="hidden items-center gap-2 font-mono text-xs uppercase tracking-widest text-vermilion sm:flex">
            <LiveDot /> on-chain · live
          </span>
        </motion.div>

        <motion.div
          variants={pop}
          className="relative overflow-hidden rounded-xl2 border border-line bg-surface/80 shadow-card backdrop-blur-sm"
        >
          {/* robbery flash */}
          <AnimatePresence>
            {round.flashWin && (
              <motion.div
                key={round.flashWin.id}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 top-0 z-20 flex items-center justify-center gap-2 bg-vermilion py-2 font-mono text-xs uppercase tracking-widest text-paper"
              >
                <Flash width={15} height={15} />
                {round.flashWin.addr} just robbed {round.flashWin.prize} ETH
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-0 lg:grid-cols-[1.5fr_1fr]">
            {/* Big pot */}
            <div className="relative border-b border-line p-8 sm:p-11 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-clay">
                <Coins width={15} height={15} /> Current pot
              </div>
              <div className="mt-4 flex items-end gap-3">
                <AnimatedNumber
                  value={round.pot}
                  decimals={4}
                  className="font-display text-[clamp(3.4rem,11vw,7rem)] font-extrabold leading-none tracking-tight text-ink"
                />
                <span className="mb-3 font-display text-2xl font-bold text-clay sm:text-3xl">
                  ETH
                </span>
              </div>
              <div className="mt-3 font-mono text-lg text-ink-soft">
                ≈ ${potUsd}
              </div>
              <p className="mt-5 max-w-sm font-serif text-xl italic text-ink-soft">
                then a random buyer wins it all.
              </p>

              {/* round progress */}
              <div className="mt-8">
                <div className="mb-2 flex justify-between font-mono text-[0.68rem] uppercase tracking-widest text-ink-soft">
                  <span>round #{round.round}</span>
                  <span>{Math.round(pct * 100)}% elapsed</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-paper-2">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-vermilion"
                    animate={{ width: `${pct * 100}%` }}
                    transition={{ ease: 'linear', duration: 0.9 }}
                  />
                </div>
              </div>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-rows-3 divide-y divide-line">
              <StatTile
                icon={<Timer width={18} height={18} />}
                label="Ends in"
                value={fmtClock(round.secondsLeft)}
                big
                tone={urgent ? 'vermilion' : 'ink'}
                pulse={urgent}
              />
              <StatTile
                icon={<Sparks width={18} height={18} />}
                label="Next seed"
                value={<AnimatedNumber value={round.seed} decimals={4} suffix=" ETH" />}
              />
              <StatTile
                icon={<Community width={18} height={18} />}
                label="Players this round"
                value={<AnimatedNumber value={round.players} decimals={0} />}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

function StatTile({ icon, label, value, big, tone = 'ink', pulse }) {
  const color = tone === 'vermilion' ? 'text-vermilion' : 'text-ink'
  return (
    <div className="flex items-center justify-between gap-4 p-7 sm:px-9">
      <div className="flex items-center gap-2.5 font-mono text-[0.72rem] uppercase tracking-widest text-ink-soft">
        <span className="text-clay">{icon}</span>
        {label}
      </div>
      <motion.div
        animate={pulse ? { scale: [1, 1.04, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1 }}
        className={`tnum font-display font-extrabold tracking-tight ${color} ${
          big ? 'text-5xl sm:text-6xl' : 'text-3xl sm:text-[2.1rem]'
        }`}
      >
        {value}
      </motion.div>
    </div>
  )
}
