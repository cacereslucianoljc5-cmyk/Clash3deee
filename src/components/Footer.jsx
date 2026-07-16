import { motion } from 'framer-motion'
import { MaskSquare, Twitter, Discord, Globe, Copy } from 'iconoir-react'
import { container, item, reveal } from '../lib/motion'

const CONTRACT = 'TBD at launch'

export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-5 pb-14 pt-28">
      <motion.div
        variants={container(0.08)}
        {...reveal(0.2)}
        className="rounded-xl2 border border-line bg-surface/60 p-8 shadow-soft sm:p-12"
      >
        <motion.div variants={item} className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-paper shadow-inset">
                <MaskSquare width={24} height={24} />
              </span>
              <div className="leading-none">
                <div className="font-display text-2xl font-extrabold text-ink">ROGUE</div>
                <div className="font-mono text-xs text-clay">· $ROGUE</div>
              </div>
            </div>
            <p className="mt-5 max-w-md font-serif text-2xl italic leading-snug text-ink-soft">
              It lives while there’s volume. It dies when the hype fades — that’s
              the point.
            </p>
          </div>

          <div className="flex gap-3">
            {[Twitter, Discord, Globe].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-ink-soft transition-all hover:-translate-y-0.5 hover:border-clay hover:text-vermilion"
              >
                <Icon width={19} height={19} />
              </a>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={item}
          className="mt-10 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-2 font-mono text-xs text-ink-soft">
            <span className="uppercase tracking-widest text-clay">Contract</span>
            <span className="rounded-lg border border-dashed border-line px-3 py-1.5 text-ink">
              {CONTRACT}
            </span>
            <Copy width={14} height={14} className="opacity-50" />
          </div>
          <div className="font-mono text-[0.7rem] uppercase tracking-widest text-ink-soft/70">
            rob the whales · feed the degens · {new Date().getFullYear()}
          </div>
        </motion.div>
      </motion.div>
    </footer>
  )
}
