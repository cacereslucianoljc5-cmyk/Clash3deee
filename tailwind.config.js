/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Warm editorial palette — uncommon for crypto (no neon, no dark)
        paper: '#F4ECDF',       // 70% dominant — warm ivory background
        'paper-2': '#EEE3D0',   // deeper section band
        surface: '#FCF8F0',     // card surface
        line: '#E4D6BF',        // hairline borders
        ink: '#2C2620',         // primary text (warm near-black)
        'ink-soft': '#6F6355',  // secondary text
        clay: '#B26B45',        // 20% secondary — terracotta structural
        'clay-soft': '#D9A882',
        gold: '#C98A1E',        // loot / money numbers
        'gold-soft': '#E6C27A',
        vermilion: '#D5442A',   // 10% accent — CTA / urgency / countdown
        plum: '#6C4A5E',        // subtle secondary accent
        sage: '#7C8466',        // subtle positive (winners)
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 0 rgba(44,38,32,0.04), 0 18px 40px -24px rgba(44,38,32,0.28)',
        card: '0 2px 0 rgba(44,38,32,0.05), 0 30px 60px -32px rgba(120,74,45,0.35)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      },
      borderRadius: {
        xl2: '1.6rem',
      },
    },
  },
  plugins: [],
}
