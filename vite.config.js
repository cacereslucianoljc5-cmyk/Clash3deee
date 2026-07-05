import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base relativa: funciona en GitHub Pages sin depender del nombre/caso del repo
export default defineConfig({
  base: './',
  plugins: [react()],
})
