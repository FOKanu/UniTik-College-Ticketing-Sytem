import {
  agentTicketDetailPath,
  ticketDetailPath,
} from '@/app/routes'
import type { UserRole } from '@/types'

export function notificationTicketPath(
  role: UserRole | null | undefined,
  ticketId: string,
): string {
  if (role === 'agent' || role === 'admin') {
    return agentTicketDetailPath(ticketId)
  }
  return ticketDetailPath(ticketId)
}
