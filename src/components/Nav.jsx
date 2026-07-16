import { motion } from 'framer-motion'
import { MaskSquare, Wallet, Running } from 'iconoir-react'

export default function Nav({ wallet }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50"
    >
      <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between gap-4 rounded-full border border-line/80 bg-surface/70 px-4 py-2.5 pl-5 shadow-soft backdrop-blur-xl sm:px-5">
        {/* Brand */}
        <a href="#top" className="group flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-paper shadow-inset transition-transform group-hover:-rotate-6">
            <MaskSquare width={20} height={20} />
          </span>
          <span className="leading-none">
            <span className="font-display text-lg font-extrabold tracking-tight text-ink">
              ROGUE
            </span>
            <span className="ml-1.5 font-mono text-xs text-clay">· $ROGUE</span>
            <span className="hidden font-serif text-sm italic text-ink-soft sm:ml-2 sm:inline">
              rob the whales, feed the degens
            </span>
          </span>
        </a>

        {/* Links */}
        <nav className="hidden items-center gap-7 font-mono text-[0.78rem] uppercase tracking-wider text-ink-soft md:flex">
          <a className="transition-colors hover:text-vermilion" href="#round">Live round</a>
          <a className="transition-colors hover:text-vermilion" href="#how">How it works</a>
          <a className="transition-colors hover:text-vermilion" href="#winners">Winners</a>
        </nav>

        {/* Connect */}
        <button
          onClick={wallet.address ? wallet.disconnect : wallet.connect}
          className="group inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 font-sans text-sm font-semibold text-paper shadow-soft transition-all hover:bg-vermilion active:scale-[0.97]"
        >
          {wallet.connecting ? (
            <>
              <Running width={17} height={17} className="animate-pulse" />
              <span>Connecting…</span>
            </>
          ) : wallet.address ? (
            <>
              <span className="h-2 w-2 rounded-full bg-gold-soft" />
              <span className="font-mono text-xs">{wallet.short}</span>
            </>
          ) : (
            <>
              <Wallet width={17} height={17} />
              <span>Connect wallet</span>
            </>
          )}
        </button>
      </div>
    </motion.header>
  )
}
