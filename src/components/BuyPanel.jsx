import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Percentage, Wallet, HandCash, Lock, Trophy, ArrowRight } from 'iconoir-react'
import { container, item, pop, reveal } from '../lib/motion'
import { Eyebrow, Pill } from './ui'

const PRESETS = [0.05, 0.1, 0.51]
const TICKET_MIN_USD = 30

export default function BuyPanel({ round, wallet }) {
  const [amount, setAmount] = useState(0.1)
  const [justBought, setJustBought] = useState(false)
  const usd = Math.round(amount * round.ethUsd)
  const eligible = usd >= TICKET_MIN_USD

  function handleBuy() {
    if (!wallet.address) return wallet.connect()
    round.buy(amount)
    setJustBought(true)
    setTimeout(() => setJustBought(false), 2600)
  }

  return (
    <section id="buy" className="mx-auto max-w-6xl px-5 pt-24">
      <motion.div
        variants={container(0.1)}
        {...reveal(0.2)}
        className="grid items-stretch gap-6 lg:grid-cols-[1fr_1.05fr]"
      >
        {/* Left — pitch */}
        <motion.div variants={item} className="flex flex-col justify-center">
          <Eyebrow>Get in the round</Eyebrow>
          <h2 className="mt-4 font-display text-4xl font-extrabold leading-[0.98] tracking-tight text-ink sm:text-5xl">
            One buy. One ticket.<br />
            <span className="text-vermilion">Same odds as the whale.</span>
          </h2>
          <p className="mt-6 max-w-md font-serif text-xl italic text-ink-soft">
            Every buy pays a 10% tax straight into the pot. Cross the threshold
            and you’re holding a ticket for this round.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Pill tone="gold"><Percentage width={13} height={13} /> 10% tax → pot</Pill>
            <Pill tone="clay"><Lock width={13} height={13} /> one ticket per wallet</Pill>
            <Pill tone="ink"><Trophy width={13} height={13} /> winner takes 100%</Pill>
          </div>
        </motion.div>

        {/* Right — the ticket machine */}
        <motion.div
          variants={pop}
          className="ticket-notch relative overflow-hidden rounded-xl2 border border-line bg-surface p-7 shadow-card sm:p-9"
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-2xl font-extrabold text-ink">Buy $ROGUE</span>
            <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-clay">
              <HandCash width={15} height={15} /> tax → pot
            </span>
          </div>

          {/* amount */}
          <div className="mt-6 rounded-2xl border border-line bg-paper/60 p-5">
            <div className="flex items-end justify-between">
              <div>
                <div className="font-mono text-[0.68rem] uppercase tracking-widest text-ink-soft">
                  You spend
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="tnum font-display text-5xl font-extrabold tracking-tight text-ink">
                    {amount}
                  </span>
                  <span className="font-display text-xl font-bold text-clay">ETH</span>
                </div>
              </div>
              <div className="text-right font-mono text-sm text-ink-soft">
                ≈ ${usd}
                <div className="mt-1 text-[0.68rem] uppercase tracking-widest text-gold">
                  +{(amount * 0.1).toFixed(3)} ETH to pot
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(p)}
                  className={`rounded-xl border px-3 py-2.5 font-mono text-sm tabular-nums transition-all active:scale-95 ${
                    amount === p
                      ? 'border-vermilion bg-vermilion text-paper shadow-soft'
                      : 'border-line bg-surface text-ink hover:border-clay'
                  }`}
                >
                  {p.toFixed(2)}
                </button>
              ))}
            </div>
          </div>

          {/* eligibility */}
          <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-dashed border-clay/40 bg-clay/[0.06] px-4 py-3">
            <Trophy width={17} height={17} className={eligible ? 'text-gold' : 'text-ink-soft'} />
            <p className="font-mono text-[0.74rem] leading-relaxed text-ink-soft">
              {eligible ? (
                <>A buy of <b className="text-ink">${usd}</b> earns you <b className="text-gold">1 ticket</b> this round.</>
              ) : (
                <>Spend ≥ <b className="text-ink">~${TICKET_MIN_USD}</b> to earn a ticket. The whale and you get the same one.</>
              )}
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleBuy}
            className="group mt-6 flex w-full items-center justify-center gap-2.5 rounded-full bg-ink px-6 py-4 font-sans text-lg font-semibold text-paper shadow-card transition-all hover:bg-vermilion active:scale-[0.98]"
          >
            {!wallet.address ? (
              <>
                <Wallet width={19} height={19} /> Connect wallet to buy
              </>
            ) : (
              <>
                <HandCash width={20} height={20} /> Buy {amount} ETH of $ROGUE
                <ArrowRight width={19} height={19} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          <AnimatePresence>
            {justBought && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gold/15 py-2.5 font-mono text-xs uppercase tracking-widest text-gold"
              >
                <Trophy width={15} height={15} /> Ticket secured · pot topped up
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </section>
  )
}
