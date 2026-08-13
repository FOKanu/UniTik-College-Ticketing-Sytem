import { Button, DepartmentBadge, PriorityBadge } from '@/components/ui'
import { ticketDetailPath } from '@/app/routes'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ProposedTicketAction } from './ticketActionTypes'
import { TicketActionEditForm } from './TicketActionEditForm'
import styles from './TicketActionCard.module.css'

interface TicketActionCardProps {
  action: ProposedTicketAction
  compact?: boolean
  onConfirm: () => void
  onCancel: () => void
  onBeginEdit: () => void
  onSaveEdit: (next: ProposedTicketAction) => void
  onCancelEdit: () => void
}

export function TicketActionCard({
  action,
  compact = false,
  onConfirm,
  onCancel,
  onBeginEdit,
  onSaveEdit,
  onCancelEdit,
}: TicketActionCardProps) {
  const { t } = useTranslation()
  const kindTitle = t(`actions.${action.kind}`)
  const busy = action.status === 'executing'
  const done = action.status === 'completed'
  const failed = action.status === 'failed'
  const cancelled = action.status === 'cancelled'
  const editing = action.status === 'editing'

  return (
    <div
      className={compact ? `${styles.card} ${styles.compact}` : styles.card}
      role="group"
      aria-label={t('actions.proposal', { action: kindTitle })}
    >
      <header className={styles.head}>
        <h3>{kindTitle}</h3>
        <span className={styles.status}>
          {done
            ? t('actions.done')
            : failed
              ? t('actions.failed')
              : cancelled
                ? t('actions.cancelled')
                : busy
                  ? t('actions.working')
                  : editing
                    ? t('actions.editing')
                    : t('actions.review')}
        </span>
      </header>

      {editing ? (
        <TicketActionEditForm
          action={action}
          compact={compact}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
        />
      ) : (
        <>
          {action.kind === 'create' && action.create ? (
            <dl className={styles.summary}>
              <div>
                <dt>{t('tickets.subject')}</dt>
                <dd>{action.create.subject}</dd>
              </div>
              <div>
                <dt>{t('tickets.department')}</dt>
                <dd>
                  <DepartmentBadge department={action.create.category} />
                </dd>
              </div>
              <div>
                <dt>{t('tickets.priority')}</dt>
                <dd>
                  <PriorityBadge priority={action.create.priority} />
                </dd>
              </div>
            </dl>
          ) : null}

          {action.kind === 'update' && action.update ? (
            <dl className={styles.summary}>
              <div>
                <dt>{t('actions.ticket')}</dt>
                <dd>{action.update.ticketLabel}</dd>
              </div>
              {action.update.status ? (
                <div>
                  <dt>{t('common.status')}</dt>
                  <dd>{action.update.status.replace('_', ' ')}</dd>
                </div>
              ) : null}
              {action.update.priority ? (
                <div>
                  <dt>{t('tickets.priority')}</dt>
                  <dd>
                    <PriorityBadge priority={action.update.priority} />
                  </dd>
                </div>
              ) : null}
              {action.update.category ? (
                <div>
                  <dt>{t('tickets.department')}</dt>
                  <dd>
                    <DepartmentBadge department={action.update.category} />
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {action.kind === 'comment' && action.comment ? (
            <dl className={styles.summary}>
              <div>
                <dt>{t('actions.ticket')}</dt>
                <dd>{action.comment.ticketLabel}</dd>
              </div>
              <div>
                <dt>{t('actions.commentLabel')}</dt>
                <dd className={styles.commentBody}>{action.comment.body}</dd>
              </div>
            </dl>
          ) : null}

          {failed && action.error ? (
            <p className={styles.error} role="alert">
              {action.error}
            </p>
          ) : null}

          {done && action.resultTicketId ? (
            <p className={styles.done}>
              <Link to={ticketDetailPath(action.resultTicketId)}>
                {t('actions.openTicket')}
                {action.resultSubject ? `: ${action.resultSubject}` : ''}
              </Link>
            </p>
          ) : null}

          {!done && !cancelled ? (
            <div className={styles.actions}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={onCancel}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={onBeginEdit}
              >
                {t('actions.editDetails')}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={onConfirm}
              >
                {busy ? t('actions.working') : kindTitle}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
