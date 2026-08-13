import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Input,
  PillRadioGroup,
  Select,
  Textarea,
} from '@/components/ui'
import { ticketsApi } from '@/lib/api'
import type { Department, Ticket, TicketPriority, TicketStatus } from '@/types'
import type { ProposedTicketAction } from './ticketActionTypes'
import styles from './TicketActionCard.module.css'

const CATEGORIES: Department[] = ['Academics', 'IT', 'Finance', 'Maintenance']
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent']
const STATUSES: TicketStatus[] = [
  'open',
  'in_progress',
  'resolved',
  'closed',
]

interface TicketActionEditFormProps {
  action: ProposedTicketAction
  compact?: boolean
  onSave: (next: ProposedTicketAction) => void
  onCancel: () => void
}

export function TicketActionEditForm({
  action,
  compact = false,
  onSave,
  onCancel,
}: TicketActionEditFormProps) {
  const { t } = useTranslation()
  const needsPicker = action.kind === 'update' || action.kind === 'comment'
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(needsPicker)
  const [ticketError, setTicketError] = useState<string | null>(null)

  const [subject, setSubject] = useState(action.create?.subject ?? '')
  const [description, setDescription] = useState(
    action.create?.description ?? '',
  )
  const [category, setCategory] = useState<Department>(
    action.create?.category ?? action.update?.category ?? 'IT',
  )
  const [priority, setPriority] = useState<TicketPriority>(
    action.create?.priority ?? action.update?.priority ?? 'medium',
  )
  const [status, setStatus] = useState<TicketStatus>(
    action.update?.status ?? 'in_progress',
  )
  const [ticketId, setTicketId] = useState(
    action.update?.ticketId ?? action.comment?.ticketId ?? '',
  )
  const [commentBody, setCommentBody] = useState(action.comment?.body ?? '')

  useEffect(() => {
    if (!needsPicker) return
    let cancelled = false
    void (async () => {
      try {
        const page = await ticketsApi.listMine({ pageSize: 50 })
        if (cancelled) return
        setTickets(page.items)
        setTicketError(null)
        setTicketId((current) => current || page.items[0]?.id || '')
      } catch (err) {
        if (cancelled) return
        setTicketError(
          err instanceof Error ? err.message : t('actions.loadTicketsError'),
        )
      } finally {
        if (!cancelled) setLoadingTickets(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [needsPicker, action.id, t])

  function selectedLabel(id: string): string {
    const hit = tickets.find((t) => t.id === id)
    return hit ? `${hit.id} · ${hit.subject}` : id
  }

  function handleSave() {
    if (action.kind === 'create') {
      onSave({
        ...action,
        status: 'pending',
        create: {
          subject: subject.trim() || 'Support request',
          description: description.trim() || subject.trim(),
          category,
          priority,
        },
      })
      return
    }

    if (action.kind === 'update') {
      if (!ticketId) return
      onSave({
        ...action,
        status: 'pending',
        update: {
          ticketId,
          ticketLabel: selectedLabel(ticketId),
          status,
          priority,
          category,
        },
      })
      return
    }

    if (!ticketId || !commentBody.trim()) return
    onSave({
      ...action,
      status: 'pending',
      comment: {
        ticketId,
        ticketLabel: selectedLabel(ticketId),
        body: commentBody.trim(),
      },
    })
  }

  return (
    <div className={styles.form}>
      {needsPicker ? (
        <label className={styles.fieldLabel}>
          {t('actions.ticket')}
          <Select
            id={`action-ticket-${action.id}`}
            aria-label={t('actions.selectTicket')}
            value={ticketId}
            disabled={loadingTickets || tickets.length === 0}
            onChange={(e) => setTicketId(e.target.value)}
            options={
              tickets.length === 0
                ? [{ value: '', label: loadingTickets ? t('common.loading') : t('tickets.noTickets') }]
                : tickets.map((t) => ({
                    value: t.id,
                    label: `${t.id} · ${t.subject}`,
                  }))
            }
          />
          {ticketError ? (
            <p className={styles.error} role="alert">
              {ticketError}
            </p>
          ) : (
            <p className={styles.pickerHint}>{t('actions.recent')}</p>
          )}
        </label>
      ) : null}

      {action.kind === 'create' ? (
        <>
          <Input
            id={`action-subject-${action.id}`}
            label={t('tickets.subject')}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Textarea
            id={`action-desc-${action.id}`}
            label={t('tickets.description')}
            value={description}
            rows={compact ? 3 : 5}
            onChange={(e) => setDescription(e.target.value)}
          />
        </>
      ) : null}

      {action.kind === 'comment' ? (
        <Textarea
          id={`action-comment-${action.id}`}
          label={t('actions.commentLabel')}
          value={commentBody}
          rows={compact ? 3 : 4}
          onChange={(e) => setCommentBody(e.target.value)}
        />
      ) : null}

      {action.kind === 'create' || action.kind === 'update' ? (
        <>
          <div>
            <PillRadioGroup
              name={`action-dept-${action.id}`}
              legend={t('tickets.department')}
              value={category}
              onChange={(v) => setCategory(v as Department)}
              options={CATEGORIES.map((c) => ({ value: c, label: t(`departments.${c === 'IT' ? 'it' : c.toLowerCase()}`) }))}
            />
          </div>
          <div>
            <PillRadioGroup
              name={`action-pri-${action.id}`}
              legend={t('tickets.priority')}
              value={priority}
              onChange={(v) => setPriority(v as TicketPriority)}
              options={PRIORITIES.map((p) => ({
                value: p,
                label: t(`common.${p}`),
              }))}
            />
          </div>
        </>
      ) : null}

      {action.kind === 'update' ? (
        <label className={styles.fieldLabel}>
          {t('common.status')}
          <Select
            id={`action-status-${action.id}`}
            aria-label={t('common.status')}
            value={status}
            onChange={(e) => setStatus(e.target.value as TicketStatus)}
            options={STATUSES.map((s) => ({
              value: s,
              label: t(s === 'in_progress' ? 'common.inProgress' : `common.${s}`),
            }))}
          />
        </label>
      ) : null}

      <div className={styles.formActions}>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          {t('common.back')}
        </Button>
        <Button type="button" size="sm" onClick={handleSave}>
          {t('actions.saveDetails')}
        </Button>
      </div>
    </div>
  )
}
