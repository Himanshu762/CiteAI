/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { devApiPlugin } from './api/_lib/vite-dev-api'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Server-side keys (GROQ_API_KEY etc.) are read from .env without the VITE_ prefix and never reach the bundle
  plugins: [react(), devApiPlugin({ ...process.env, ...loadEnv(mode, process.cwd(), '') })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
    outDir: 'dist',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  css: {
    postcss: './postcss.config.cjs'
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
}))
