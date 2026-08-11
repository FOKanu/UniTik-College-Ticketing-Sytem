import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppLocale = 'en' | 'de'

interface LocaleState {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => {
        set({ locale })
        if (typeof document !== 'undefined') {
          document.documentElement.lang = locale
        }
      },
    }),
    {
      name: 'tss-locale',
      onRehydrateStorage: () => (state) => {
        if (state?.locale && typeof document !== 'undefined') {
          document.documentElement.lang = state.locale
        }
      },
    },
  ),
)
