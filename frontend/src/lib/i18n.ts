import { useLocaleStore, type AppLocale } from '@/stores/localeStore'

const dictionaries: Record<AppLocale, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.myTickets': 'My Tickets',
    'nav.assistant': 'AI Assistant',
    'nav.faq': 'FAQ & Resources',
    'nav.profile': 'Profile',
    'nav.queue': 'Ticket Queue',
    'nav.knowledge': 'Knowledge Base',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.signOut': 'Sign out',
    'chrome.language': 'Language',
    'chrome.notifications': 'Notifications',
    'auth.stayLoggedIn': 'Stay logged in',
    'auth.stayLoggedInHint': 'Uncheck to clear your session when this browser tab closes.',
    'auth.demoFixture': 'Fixture mode — use the demo accounts below (password: password).',
    'auth.demoLive': 'Live API mode — seeded accounts use password demo1234.',
    'auth.demoTitle': 'Demo accounts',
  },
  de: {
    'nav.dashboard': 'Übersicht',
    'nav.myTickets': 'Meine Tickets',
    'nav.assistant': 'KI-Assistent',
    'nav.faq': 'FAQ & Ressourcen',
    'nav.profile': 'Profil',
    'nav.queue': 'Ticket-Warteschlange',
    'nav.knowledge': 'Wissensdatenbank',
    'nav.analytics': 'Analysen',
    'nav.settings': 'Einstellungen',
    'nav.signOut': 'Abmelden',
    'chrome.language': 'Sprache',
    'chrome.notifications': 'Benachrichtigungen',
    'auth.stayLoggedIn': 'Angemeldet bleiben',
    'auth.stayLoggedInHint':
      'Deaktivieren, um die Sitzung beim Schließen dieses Tabs zu beenden.',
    'auth.demoFixture':
      'Fixture-Modus — Demo-Konten unten verwenden (Passwort: password).',
    'auth.demoLive':
      'Live-API-Modus — Seed-Konten nutzen das Passwort demo1234.',
    'auth.demoTitle': 'Demo-Konten',
  },
}

export type MessageKey = keyof typeof dictionaries.en

export function translate(locale: AppLocale, key: MessageKey): string {
  return dictionaries[locale][key] ?? dictionaries.en[key] ?? key
}

export function useT() {
  const locale = useLocaleStore((s) => s.locale)
  return (key: MessageKey) => translate(locale, key)
}
