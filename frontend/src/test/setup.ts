import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Polyfill localStorage if missing in test environment
const storageStore = new Map<string, string>()
const localStorageMock: Storage = {
  getItem: (key: string) => storageStore.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storageStore.set(key, String(value))
  },
  removeItem: (key: string) => {
    storageStore.delete(key)
  },
  clear: () => {
    storageStore.clear()
  },
  key: (index: number) => Array.from(storageStore.keys())[index] ?? null,
  get length() {
    return storageStore.size
  },
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })
}

if (typeof globalThis !== 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })
}

// These suites assert mock-mode behaviour, so pin the data source rather than
// letting a developer's local .env (e.g. VITE_DATA_SOURCE=api) change results.
vi.stubEnv('VITE_DATA_SOURCE', 'mock')
