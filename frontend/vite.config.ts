import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

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
        target: process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
      '/ws': {
        target: process.env.VITE_WS_PROXY_TARGET || 'ws://127.0.0.1:4000',
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
