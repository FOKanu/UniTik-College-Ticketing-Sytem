// Central place to compose context providers (auth store, query client, etc.).
// TODO: add a data-fetching provider (React Query or similar) once modules need real caching.

import { ReactNode } from 'react';
import { AuthProvider } from '../store/auth.store';

export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
