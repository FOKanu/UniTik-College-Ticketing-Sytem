import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
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
            <h1>Log a New Ticket</h1>
            <p>Create a ticket on behalf of a student, or log an internal issue.</p>
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
                  legend="Requester type"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.requesterType?.message}
                  options={[
                    { value: 'student', label: 'Student' },
                    { value: 'walkin', label: 'Walk-in / Phone' },
                    { value: 'internal', label: 'Internal Staff Issue' },
                  ]}
                />
              )}
            />

            <Input
              id="student-search"
              label="Requester"
              placeholder="Search student by name, ID, or email..."
              error={errors.requester?.message}
              {...register('requester')}
            />

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <PillRadioGroup
                  name="agent-category"
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
              id="agent-subject"
              label="Subject"
              placeholder="Brief summary of the issue"
              error={errors.subject?.message}
              {...register('subject')}
            />
            <Textarea
              id="agent-description"
              label="Description"
              placeholder="Describe the issue in detail..."
              error={errors.description?.message}
              {...register('description')}
            />

            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <PillRadioGroup
                  name="agent-priority"
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

            <Select
              id="assign-to"
              label="Assign To"
              options={assignOptions}
              error={errors.assignTo?.message}
              {...register('assignTo')}
            />

            <div className={styles.actions}>
              <Button type="submit">Create Ticket</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void navigate(ROUTES.queue)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </section>

        <aside className={styles.info}>
          <h2>Logging on behalf of someone?</h2>
          <ul>
            <li>Search by ID auto-fills student details</li>
            <li>Tickets are tagged &quot;Staff-logged&quot;</li>
            <li>Email confirmations are sent automatically</li>
            <li>Internal issues route to specific queues</li>
          </ul>
        </aside>
      </div>
    </div>
  )
}
