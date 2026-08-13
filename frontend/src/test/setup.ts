import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// These suites assert mock-mode behaviour, so pin the data source rather than
// letting a developer's local .env (e.g. VITE_DATA_SOURCE=api) change results.
vi.stubEnv('VITE_DATA_SOURCE', 'mock')
