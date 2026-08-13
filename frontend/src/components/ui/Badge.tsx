import styles from './Badge.module.css'
import type { TicketPriority, TicketStatus } from '@/types'
import { useTranslation } from 'react-i18next'

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
  open: 'common.open',
  in_progress: 'common.inProgress',
  waiting_on_student: 'common.waiting',
  resolved: 'common.resolved',
  closed: 'common.closed',
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
  const { t } = useTranslation()
  return <Badge tone={statusTone[status]}>{t(statusLabel[status])}</Badge>
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const { t } = useTranslation()
  return <Badge tone={priorityTone[priority]}>{t(`common.${priority}`)}</Badge>
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
  const { t } = useTranslation()
  if (breached) {
    return <Badge tone="danger">{t('common.breached')}</Badge>
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
  const { t } = useTranslation()
  const key = department === 'IT' ? 'it' : department.toLowerCase().replace(' ', '-')
  return <Badge tone="department">{t(`departments.${key}`, { defaultValue: department })}</Badge>
}
