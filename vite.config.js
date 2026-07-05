import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project site is served from /clash3deee/
export default defineConfig({
  base: '/clash3deee/',
  plugins: [react()],
})
