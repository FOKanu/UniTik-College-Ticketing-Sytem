import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeState {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return preference
}

export function applyDocumentTheme(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference)
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = resolved
    document.documentElement.style.colorScheme = resolved
  }
  return resolved
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      resolved: 'light',
      setPreference: (preference) => {
        const resolved = applyDocumentTheme(preference)
        set({ preference, resolved })
      },
    }),
    {
      name: 'tss-theme',
      partialize: (state) => ({ preference: state.preference }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const resolved = applyDocumentTheme(state.preference)
        useThemeStore.setState({ resolved })
      },
    },
  ),
)

/** Keep `system` preference in sync when OS theme changes. */
export function startThemeMediaListener(): () => void {
  if (typeof window === 'undefined') return () => {}
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    const { preference, setPreference } = useThemeStore.getState()
    if (preference === 'system') setPreference('system')
  }
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
