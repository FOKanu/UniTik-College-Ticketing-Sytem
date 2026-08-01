import styles from './Badge.module.css'
import type { TicketPriority, TicketStatus } from '@/types'

type Tone =
  | 'open'
  | 'inProgress'
  | 'resolved'
  | 'closed'
  | 'department'
  | 'high'
  | 'medium'
  | 'low'
  | 'urgent'
  | 'info'
  | 'warn'
  | 'success'
  | 'neutral'
  | 'danger'

const statusLabel: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_on_student: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
}

const statusTone: Record<TicketStatus, Tone> = {
  open: 'open',
  in_progress: 'inProgress',
  waiting_on_student: 'warn',
  resolved: 'resolved',
  closed: 'closed',
}

const priorityTone: Record<TicketPriority, Tone> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'urgent',
}

interface BadgeProps {
  children: string
  tone?: Tone
}

export function Badge({ children, tone = 'info' }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge>
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const label = priority.charAt(0).toUpperCase() + priority.slice(1)
  return <Badge tone={priorityTone[priority]}>{label}</Badge>
}

export function DepartmentBadge({ department }: { department: string }) {
  return <Badge tone="department">{department}</Badge>
}
