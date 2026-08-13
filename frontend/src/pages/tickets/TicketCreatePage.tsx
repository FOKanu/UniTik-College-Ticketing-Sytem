import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/routes'
import {
  Button,
  ButtonLink,
  FileDropzone,
  Input,
  PillRadioGroup,
  Textarea,
} from '@/components/ui'
import { IconChat } from '@/components/ui/icons'
import {
  ticketCreateSchema,
  type TicketCreateFormValues,
} from '@/lib/validation'
import { useTicketStore, useUiStore } from '@/stores'
import type { Department, TicketPriority } from '@/types'
import styles from './TicketCreatePage.module.css'

const CATEGORIES: Department[] = ['Academics', 'IT', 'Finance', 'Maintenance']
const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high']

export function TicketCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createTicket = useTicketStore((s) => s.createTicket)
  const mutating = useTicketStore((s) => s.mutating)
  const apiError = useTicketStore((s) => s.error)
  const pushToast = useUiStore((s) => s.pushToast)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TicketCreateFormValues>({
    resolver: zodResolver(ticketCreateSchema),
    defaultValues: {
      category: 'IT',
      subject: '',
      description: '',
      priority: 'medium',
    },
  })

  async function onSubmit(values: TicketCreateFormValues) {
    const ticket = await createTicket(
      {
        subject: values.subject,
        description: values.description,
        category: values.category,
        priority: values.priority,
      },
      pendingFile,
    )
    if (ticket) {
      const uploadFailed = Boolean(pendingFile && useTicketStore.getState().error)
      pushToast({
        title: uploadFailed ? t('tickets.createdWarning') : t('tickets.created'),
        body: uploadFailed
          ? t('tickets.uploadFailed', { id: ticket.id })
          : t('tickets.wasSubmitted', { id: ticket.id }),
        tone: uploadFailed ? 'error' : 'success',
      })
      void navigate(ROUTES.tickets)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <section className={styles.formCard}>
          <header>
            <h1>{t('tickets.createHeading')}</h1>
            <p>{t('tickets.createHelp')}</p>
          </header>

          <form
            className={styles.form}
            onSubmit={(e) => void handleSubmit(onSubmit)(e)}
            noValidate
          >
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <PillRadioGroup
                  name="ticket-category"
                  legend={t('common.category')}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.category?.message ? t(errors.category.message) : undefined}
                  options={CATEGORIES.map((item) => ({
                    value: item,
                    label: item,
                  }))}
                />
              )}
            />

            <Input
              id="subject"
              label={t('tickets.subject')}
              placeholder={t('tickets.summaryPlaceholder')}
              error={errors.subject?.message ? t(errors.subject.message) : undefined}
              {...register('subject')}
            />
            <Textarea
              id="description"
              label={t('tickets.description')}
              placeholder={t('tickets.describePlaceholder')}
              error={errors.description?.message ? t(errors.description.message) : undefined}
              {...register('description')}
            />

            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <PillRadioGroup
                  name="ticket-priority"
                  legend={t('tickets.priority')}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.priority?.message ? t(errors.priority.message) : undefined}
                  options={PRIORITIES.map((item) => ({
                    value: item,
                    label: item.charAt(0).toUpperCase() + item.slice(1),
                  }))}
                />
              )}
            />

            <FileDropzone
              fileName={pendingFile?.name ?? null}
              disabled={mutating}
              onChange={(file) => setPendingFile(file)}
            />

            {apiError ? (
              <p className={styles.apiError} role="alert">
                {apiError}
              </p>
            ) : null}

            <div className={styles.actions}>
              <Button type="submit" disabled={mutating}>
                {mutating ? t('tickets.submitting') : t('tickets.submit')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void navigate(ROUTES.tickets)}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </section>

        <aside className={styles.aiCard}>
          <div className={styles.aiIcon} aria-hidden="true">
            <IconChat width={22} height={22} />
          </div>
          <h2>{t('tickets.aiFirst')}</h2>
          <p>{t('tickets.aiHelp')}</p>
          <ButtonLink to={ROUTES.assistant} variant="secondary">
            {t('tickets.askAi')}
          </ButtonLink>
        </aside>
      </div>
    </div>
  )
}
