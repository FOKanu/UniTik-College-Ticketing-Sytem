// Thin convenience wrapper around the auth store, kept separate so components import from
// hooks/ by convention rather than reaching into store/ directly.

import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  return useAuthStore();
}
