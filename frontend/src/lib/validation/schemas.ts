import { z } from 'zod'

const universityEmail = z
  .string()
  .trim()
  .min(1, 'validation.emailRequired')
  .email('validation.emailInvalid')
  .refine(
    (value) =>
      /@(?:[\w-]+\.)*(?:edu|university\.edu|mdh\.de|mdh-berlin\.de|campus\.edu|tum\.de|uni-hamburg\.de|rwth-aachen\.de)$/i.test(
        value,
      ),
    'validation.emailUniversity',
  )

export const loginSchema = z.object({
  email: universityEmail,
  password: z.string().min(1, 'validation.passwordRequired'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, 'validation.nameMin').max(80, 'validation.nameMax'),
    email: universityEmail,
    password: z
      .string()
      .min(8, 'validation.passwordMin').max(128, 'validation.passwordMax'),
    confirmPassword: z.string().min(1, 'validation.passwordConfirm'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'validation.passwordMatch',
    path: ['confirmPassword'],
  })

export type RegisterFormValues = z.infer<typeof registerSchema>

const departmentEnum = z.enum(['Academics', 'IT', 'Finance', 'Maintenance'])
const studentPriorityEnum = z.enum(['low', 'medium', 'high'])
const agentPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent'])

export const ticketCreateSchema = z.object({
  category: departmentEnum,
  subject: z
    .string()
    .trim()
    .min(5, 'validation.subjectMin').max(120, 'validation.subjectMax'),
  description: z
    .string()
    .trim()
    .min(20, 'validation.descriptionMin').max(5000, 'validation.descriptionMax'),
  priority: studentPriorityEnum,
})

export type TicketCreateFormValues = z.infer<typeof ticketCreateSchema>

export const agentTicketCreateSchema = z.object({
  requesterType: z.enum(['student', 'walkin', 'internal']),
  requester: z
    .string()
    .trim()
    .min(2, 'validation.requesterRequired').max(120, 'validation.requesterMax'),
  category: departmentEnum,
  subject: z
    .string()
    .trim()
    .min(5, 'validation.subjectMin').max(120, 'validation.subjectMax'),
  description: z
    .string()
    .trim()
    .min(20, 'validation.descriptionMin').max(5000, 'validation.descriptionMax'),
  priority: agentPriorityEnum,
  assignTo: z.string().min(1, 'validation.assignRequired'),
})

export type AgentTicketCreateFormValues = z.infer<typeof agentTicketCreateSchema>

export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'validation.departmentMin').max(60, 'validation.departmentMax'),
  routing: z
    .string()
    .trim()
    .max(120, 'validation.routingMax')
    .optional(),
})

export type DepartmentFormValues = z.infer<typeof departmentSchema>
