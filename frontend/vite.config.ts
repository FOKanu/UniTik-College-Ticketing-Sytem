import path from 'node:path'
import { existsSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

function defaultProxyTarget(kind: 'http' | 'ws'): string {
  const fromEnv =
    kind === 'http'
      ? process.env.VITE_PROXY_TARGET
      : process.env.VITE_WS_PROXY_TARGET
  if (fromEnv) return fromEnv
  // Inside Compose, localhost is the frontend container — use the backend service.
  if (existsSync('/.dockerenv')) {
    return kind === 'http' ? 'http://backend:4000' : 'ws://backend:4000'
  }
  return kind === 'http' ? 'http://localhost:4000' : 'ws://localhost:4000'
}

const apiProxy = defaultProxyTarget('http')
const wsProxy = defaultProxyTarget('ws')

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
