import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Build variant that inlines all JS/CSS into a single self-contained index.html
// (output in dist-single/), so the game can be opened by double-clicking the
// file. The Neon leaderboard falls back to localStorage in this mode.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-single',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
})
