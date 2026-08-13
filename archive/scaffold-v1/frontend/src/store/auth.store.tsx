// Lightweight auth store using React Context. TODO: swap for a state library (Zustand/Redux) if
// the team needs more than auth-session state shared globally.

import { ReactNode, createContext, useContext, useMemo, useState } from 'react';

export type Role = 'STUDENT' | 'STAFF' | 'ADMIN';

export interface AuthState {
  token: string | null;
  role: Role | null;
  setSession: (token: string, role: Role) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('uts_token'));
  const [role, setRole] = useState<Role | null>(null);

  const value = useMemo<AuthState>(
    () => ({
      token,
      role,
      setSession: (newToken: string, newRole: Role) => {
        localStorage.setItem('uts_token', newToken);
        setToken(newToken);
        setRole(newRole);
      },
      clearSession: () => {
        localStorage.removeItem('uts_token');
        setToken(null);
        setRole(null);
      },
    }),
    [token, role],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthStore(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthStore must be used within AuthProvider');
  return ctx;
}
