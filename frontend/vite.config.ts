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
  return kind === 'http' ? 'http://127.0.0.1:4000' : 'ws://127.0.0.1:4000'
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
    // Bind IPv4 loopback so Tailscale Funnel (http://127.0.0.1:5173) can
    // reach Vite. Default macOS Vite listens on [::1] only → Funnel 502s.
    host: '127.0.0.1',
    port: 5173,
    // Funnel presents the machine DNS name as Host — allow it (and any
    // *.ts.net) without opening Vite to the LAN.
    allowedHosts: ['.ts.net', 'localhost', '127.0.0.1'],
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
