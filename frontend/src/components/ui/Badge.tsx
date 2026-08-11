import { useT, type MessageKey } from '@/lib/i18n'
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

const statusTone: Record<TicketStatus, Tone> = {
  open: 'open',
  in_progress: 'inProgress',
  waiting_on_student: 'warn',
  resolved: 'resolved',
  closed: 'closed',
}

const statusKey: Record<TicketStatus, MessageKey> = {
  open: 'status.open',
  in_progress: 'status.in_progress',
  waiting_on_student: 'status.waiting_on_student',
  resolved: 'status.resolved',
  closed: 'status.closed',
}

const priorityTone: Record<TicketPriority, Tone> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  urgent: 'urgent',
}

const priorityKey: Record<TicketPriority, MessageKey> = {
  low: 'priority.low',
  medium: 'priority.medium',
  high: 'priority.high',
  urgent: 'priority.urgent',
}

const deptKey: Record<string, MessageKey> = {
  Academics: 'dept.Academics',
  IT: 'dept.IT',
  Finance: 'dept.Finance',
  Maintenance: 'dept.Maintenance',
}

interface BadgeProps {
  children: string
  tone?: Tone
}

export function Badge({ children, tone = 'info' }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const t = useT()
  return <Badge tone={statusTone[status]}>{t(statusKey[status])}</Badge>
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const t = useT()
  return <Badge tone={priorityTone[priority]}>{t(priorityKey[priority])}</Badge>
}

/** First-response SLA cue for queue / dashboard cells. */
export function SlaBadge({
  hoursRemaining,
  breached,
  atRiskHours = 8,
}: {
  hoursRemaining?: number | null
  breached?: boolean
  atRiskHours?: number
}) {
  const t = useT()
  if (breached) {
    return <Badge tone="danger">{t('sla.breached')}</Badge>
  }
  if (hoursRemaining == null) {
    return <Badge tone="neutral">—</Badge>
  }
  if (hoursRemaining <= atRiskHours) {
    return <Badge tone="warn">{`${hoursRemaining}h`}</Badge>
  }
  return <Badge tone="info">{`${hoursRemaining}h`}</Badge>
}

export function DepartmentBadge({ department }: { department: string }) {
  const t = useT()
  const key = deptKey[department]
  return <Badge tone="department">{key ? t(key) : department}</Badge>
}
