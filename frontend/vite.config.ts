import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const apiProxy = process.env.VITE_PROXY_TARGET || 'http://localhost:4000'
const wsProxy = process.env.VITE_WS_PROXY_TARGET || 'ws://localhost:4000'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: apiProxy,
        changeOrigin: true,
      },
      '/ws': {
        target: wsProxy,
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
