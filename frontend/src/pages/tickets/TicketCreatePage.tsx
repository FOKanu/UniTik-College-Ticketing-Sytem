import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
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
        title: uploadFailed ? 'Ticket created with upload warning' : 'Ticket created',
        body: uploadFailed
          ? `${ticket.id} was submitted, but the attachment failed to upload.`
          : `${ticket.id} was submitted.`,
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
            <h1>Create a New Ticket</h1>
            <p>
              Tell us what went wrong and we will route it to the right team.
            </p>
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
                  legend="Category"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.category?.message}
                  options={CATEGORIES.map((item) => ({
                    value: item,
                    label: item,
                  }))}
                />
              )}
            />

            <Input
              id="subject"
              label="Subject"
              placeholder="Brief summary of the issue"
              error={errors.subject?.message}
              {...register('subject')}
            />
            <Textarea
              id="description"
              label="Description"
              placeholder="Describe your issue in detail..."
              error={errors.description?.message}
              {...register('description')}
            />

            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <PillRadioGroup
                  name="ticket-priority"
                  legend="Priority"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.priority?.message}
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
                {mutating ? 'Submitting…' : 'Submit Ticket'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void navigate(ROUTES.tickets)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </section>

        <aside className={styles.aiCard}>
          <div className={styles.aiIcon} aria-hidden="true">
            <IconChat width={22} height={22} />
          </div>
          <h2>Try our AI Assistant first</h2>
          <p>
            Password resets, tuition timelines, and common IT issues can often
            be resolved instantly.
          </p>
          <ButtonLink to={ROUTES.assistant} variant="secondary">
            Ask AI Assistant
          </ButtonLink>
        </aside>
      </div>
    </div>
  )
}
