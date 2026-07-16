import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'client',
  // GitHub Pages serves from /<repo-name>/, so set GH_PAGES_BASE when deploying
  base: process.env.GH_PAGES_BASE || '/',
  plugins: [react()],
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
