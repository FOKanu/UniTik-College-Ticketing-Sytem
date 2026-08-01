/**
 * Frontend route & transition schema — TicketHub / MDH
 */

export const ROUTES = {
  home: '/',
  institution: '/institution',
  login: '/login',
  register: '/register',
  // Student
  dashboard: '/dashboard',
  tickets: '/tickets',
  ticketNew: '/tickets/new',
  ticketDetail: '/tickets/:ticketId',
  assistant: '/assistant',
  faq: '/faq',
  notifications: '/notifications',
  profile: '/profile',
  // Staff / agent
  agent: '/agent',
  queue: '/agent/queue',
  agentTicketNew: '/agent/tickets/new',
  agentTicketDetail: '/agent/tickets/:ticketId',
  knowledge: '/agent/knowledge',
  analytics: '/agent/analytics',
  // Admin
  admin: '/admin',
  departments: '/admin/departments',
  settings: '/admin/settings',
  settingsDepartments: '/admin/settings/departments',
  settingsPeople: '/admin/settings/people',
  settingsKnowledge: '/admin/settings/knowledge',
  forbidden: '/forbidden',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export function ticketDetailPath(ticketId: string): string {
  return `/tickets/${ticketId}`
}

export function agentTicketDetailPath(ticketId: string): string {
  return `/agent/tickets/${ticketId}`
}

export const STUDENT_ROLES = ['student', 'agent', 'admin'] as const
export const AGENT_ROLES = ['agent', 'admin'] as const
export const ADMIN_ROLES = ['admin'] as const
export const PROTECTED_ROLES = STUDENT_ROLES

export const STUDENT_TRANSITIONS = {
  login: [ROUTES.dashboard, ROUTES.register],
  register: [ROUTES.dashboard, ROUTES.login],
  dashboard: [ROUTES.tickets, ROUTES.ticketNew, ROUTES.assistant, ROUTES.faq],
  tickets: [ROUTES.dashboard, ROUTES.ticketNew, ROUTES.ticketDetail],
  ticketNew: [ROUTES.tickets, ROUTES.ticketDetail],
  ticketDetail: [ROUTES.tickets, ROUTES.dashboard],
  assistant: [ROUTES.ticketNew, ROUTES.faq],
} as const
