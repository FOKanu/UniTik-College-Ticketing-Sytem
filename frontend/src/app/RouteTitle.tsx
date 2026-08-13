import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/routes'
import { usePageTitle } from '@/hooks/usePageTitle'

const TITLES: Record<string, string> = {
  [ROUTES.login]: 'auth.signIn', [ROUTES.register]: 'auth.createAccount', [ROUTES.dashboard]: 'nav.dashboard',
  [ROUTES.tickets]: 'nav.myTickets', [ROUTES.ticketNew]: 'nav.createTicket', [ROUTES.assistant]: 'nav.assistant',
  [ROUTES.faq]: 'nav.faq', [ROUTES.notifications]: 'nav.notifications', [ROUTES.profile]: 'nav.profile',
  [ROUTES.agent]: 'titles.agentDashboard', [ROUTES.queue]: 'nav.queue', [ROUTES.agentTicketNew]: 'titles.logTicket',
  [ROUTES.knowledge]: 'nav.knowledge', [ROUTES.analytics]: 'nav.analytics', [ROUTES.admin]: 'titles.adminDashboard',
  [ROUTES.departments]: 'nav.departments', [ROUTES.settings]: 'nav.settings', [ROUTES.settingsDepartments]: 'nav.settings',
  [ROUTES.settingsPeople]: 'nav.settings', [ROUTES.settingsKnowledge]: 'nav.settings', [ROUTES.institution]: 'titles.chooseInstitution',
  [ROUTES.forbidden]: 'titles.accessDenied',
}

function resolveTitle(pathname: string): string {
  if (pathname.startsWith('/tickets/') && pathname !== ROUTES.ticketNew) {
    return 'nav.ticketDetail'
  }
  if (
    pathname.startsWith('/agent/tickets/') &&
    pathname !== ROUTES.agentTicketNew
  ) {
    return 'nav.ticketDetail'
  }
  return TITLES[pathname] ?? 'TicketHub'
}

export function RouteTitle() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  usePageTitle(t(resolveTitle(pathname)))
  return null
}
