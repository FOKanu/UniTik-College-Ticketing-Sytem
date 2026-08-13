import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/routes'
import {
  Button,
  Input,
  PillRadioGroup,
  Select,
  Textarea,
} from '@/components/ui'
import { usersApi, type StaffMember } from '@/lib/api'
import {
  agentTicketCreateSchema,
  type AgentTicketCreateFormValues,
} from '@/lib/validation'
import { useAuthStore } from '@/stores'
import type { Department, TicketPriority } from '@/types'
import styles from './AgentCreateTicketPage.module.css'

const CATEGORIES: Department[] = ['Academics', 'IT', 'Finance', 'Maintenance']
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'urgent']

export function AgentCreateTicketPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const [staff, setStaff] = useState<StaffMember[]>([])

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AgentTicketCreateFormValues>({
    resolver: zodResolver(agentTicketCreateSchema),
    defaultValues: {
      requesterType: 'student',
      requester: 'Amara K.',
      category: 'Maintenance',
      subject: '',
      description: '',
      priority: 'high',
      assignTo: currentUser?.id ?? 'unassigned',
    },
  })

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const members = await usersApi.listStaff()
        if (!cancelled) setStaff(members)
      } catch {
        if (!cancelled) setStaff([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function onSubmit(_values: AgentTicketCreateFormValues) {
    void navigate(ROUTES.queue)
  }

  const assignOptions = [
    { value: 'unassigned', label: 'Unassigned' },
    ...staff.map((member) => ({
      value: member.id,
      label:
        member.id === currentUser?.id
          ? `${member.displayName} (me)`
          : member.department
            ? `${member.displayName} · ${member.department}`
            : member.displayName,
    })),
  ]

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <section className={styles.formCard}>
          <header>
            <h1>{t('titles.logTicket')}</h1><p>{t('agentCreate.description')}</p>
          </header>

          <form
            className={styles.form}
            onSubmit={(e) => void handleSubmit(onSubmit)(e)}
            noValidate
          >
            <Controller
              name="requesterType"
              control={control}
              render={({ field }) => (
                <PillRadioGroup
                  name="requester-type"
                  legend={t('agentCreate.requesterType')}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.requesterType?.message ? t(errors.requesterType.message) : undefined}
                  options={[
                    { value: 'student', label: t('agentCreate.student') }, { value: 'walkin', label: t('agentCreate.walkin') }, { value: 'internal', label: t('agentCreate.internal') },
                  ]}
                />
              )}
            />

            <Input
              id="student-search"
              label={t('agentCreate.requester')}
              placeholder={t('agentCreate.requesterPlaceholder')}
              error={errors.requester?.message ? t(errors.requester.message) : undefined}
              {...register('requester')}
            />

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <PillRadioGroup
                  name="agent-category"
                  legend={t('common.category')}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.category?.message ? t(errors.category.message) : undefined}
                  options={CATEGORIES.map((item) => ({
                    value: item,
                    label: t(`departments.${item === 'IT' ? 'it' : item.toLowerCase()}`),
                  }))}
                />
              )}
            />

            <Input
              id="agent-subject"
              label={t('tickets.subject')} placeholder={t('tickets.summaryPlaceholder')}
              error={errors.subject?.message ? t(errors.subject.message) : undefined}
              {...register('subject')}
            />
            <Textarea
              id="agent-description"
              label={t('tickets.description')} placeholder={t('tickets.describePlaceholder')}
              error={errors.description?.message ? t(errors.description.message) : undefined}
              {...register('description')}
            />

            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <PillRadioGroup
                  name="agent-priority"
                  legend={t('tickets.priority')}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.priority?.message ? t(errors.priority.message) : undefined}
                  options={PRIORITIES.map((item) => ({
                    value: item,
                    label: t(`common.${item}`),
                  }))}
                />
              )}
            />

            <Select
              id="assign-to"
              label={t('agentCreate.assign')}
              options={assignOptions}
              error={errors.assignTo?.message ? t(errors.assignTo.message) : undefined}
              {...register('assignTo')}
            />

            <div className={styles.actions}>
              <Button type="submit">{t('tickets.create')}</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void navigate(ROUTES.queue)}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </section>

        <aside className={styles.info}>
          <h2>{t('agentCreate.behalf')}</h2>
          <ul>
            <li>{t('agentCreate.note1')}</li><li>{t('agentCreate.note2')}</li><li>{t('agentCreate.note3')}</li><li>{t('agentCreate.note4')}</li>
          </ul>
        </aside>
      </div>
    </div>
  )
}
