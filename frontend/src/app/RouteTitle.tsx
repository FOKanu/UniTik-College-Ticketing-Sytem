import { useLocation } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { usePageTitle } from '@/hooks/usePageTitle'

const TITLES: Record<string, string> = {
  [ROUTES.login]: 'Sign in',
  [ROUTES.register]: 'Create account',
  [ROUTES.dashboard]: 'Dashboard',
  [ROUTES.tickets]: 'My Tickets',
  [ROUTES.ticketNew]: 'Create Ticket',
  [ROUTES.assistant]: 'AI Assistant',
  [ROUTES.faq]: 'FAQ',
  [ROUTES.notifications]: 'Notifications',
  [ROUTES.profile]: 'Profile',
  [ROUTES.agent]: 'Agent Dashboard',
  [ROUTES.queue]: 'Ticket Queue',
  [ROUTES.agentTicketNew]: 'Log Ticket',
  [ROUTES.knowledge]: 'Knowledge Base',
  [ROUTES.analytics]: 'Analytics',
  [ROUTES.admin]: 'Admin Dashboard',
  [ROUTES.departments]: 'Departments',
  [ROUTES.settings]: 'Settings',
  [ROUTES.settingsDepartments]: 'Settings',
  [ROUTES.settingsPeople]: 'Settings',
  [ROUTES.settingsKnowledge]: 'Settings',
  [ROUTES.institution]: 'Choose institution',
  [ROUTES.forbidden]: 'Access Denied',
}

function resolveTitle(pathname: string): string {
  if (pathname.startsWith('/tickets/') && pathname !== ROUTES.ticketNew) {
    return 'Ticket Detail'
  }
  if (
    pathname.startsWith('/agent/tickets/') &&
    pathname !== ROUTES.agentTicketNew
  ) {
    return 'Ticket Detail'
  }
  return TITLES[pathname] ?? 'TicketHub'
}

export function RouteTitle() {
  const { pathname } = useLocation()
  usePageTitle(resolveTitle(pathname))
  return null
}
