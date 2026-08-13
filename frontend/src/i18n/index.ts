import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { de } from '@/locales/de/translation'
import { en } from '@/locales/en/translation'

export const LANGUAGE_STORAGE_KEY = 'tickethub.language'
export const supportedLanguages = ['en', 'de'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

function initialLanguage(): SupportedLanguage {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === 'en' || stored === 'de') return stored
  } catch {
    // Storage can be unavailable in privacy modes; continue with browser locale.
  }
  const browser = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'en'
  return browser === 'de' || browser.startsWith('de-') ? 'de' : 'en'
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, de: { translation: de } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  supportedLngs: [...supportedLanguages],
  compatibilityJSON: 'v4',
  interpolation: { escapeValue: false },
  returnNull: false,
})

function applyLanguage(language: string) {
  const normalized: SupportedLanguage = language.startsWith('de') ? 'de' : 'en'
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = normalized
  }
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized)
  } catch {
    // The active in-memory locale still works when persistence is unavailable.
  }
}

applyLanguage(i18n.resolvedLanguage ?? i18n.language)
i18n.on('languageChanged', applyLanguage)

export function browserLocale(language = i18n.resolvedLanguage ?? i18n.language) {
  return language.startsWith('de') ? 'de-DE' : 'en-US'
}

export default i18n
