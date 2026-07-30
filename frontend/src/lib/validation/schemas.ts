import { z } from 'zod'

const universityEmail = z
  .string()
  .trim()
  .min(1, 'University email is required.')
  .email('Enter a valid email address.')
  .refine(
    (value) =>
      /@(?:[\w-]+\.)*(?:edu|university\.edu|mdh\.de|campus\.edu)$/i.test(value),
    'Use your university email address (e.g. you@stud.mdh.de).',
  )

export const loginSchema = z.object({
  email: universityEmail,
  password: z.string().min(1, 'Password is required.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters.')
      .max(80, 'Full name is too long.'),
    email: universityEmail,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(128, 'Password is too long.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
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
    .min(5, 'Subject must be at least 5 characters.')
    .max(120, 'Subject must be 120 characters or fewer.'),
  description: z
    .string()
    .trim()
    .min(20, 'Please provide at least 20 characters describing the issue.')
    .max(5000, 'Description is too long.'),
  priority: studentPriorityEnum,
})

export type TicketCreateFormValues = z.infer<typeof ticketCreateSchema>

export const agentTicketCreateSchema = z.object({
  requesterType: z.enum(['student', 'walkin', 'internal']),
  requester: z
    .string()
    .trim()
    .min(2, 'Search for a requester or enter a name.')
    .max(120, 'Requester name is too long.'),
  category: departmentEnum,
  subject: z
    .string()
    .trim()
    .min(5, 'Subject must be at least 5 characters.')
    .max(120, 'Subject must be 120 characters or fewer.'),
  description: z
    .string()
    .trim()
    .min(20, 'Please provide at least 20 characters describing the issue.')
    .max(5000, 'Description is too long.'),
  priority: agentPriorityEnum,
  assignTo: z.string().min(1, 'Choose who to assign this ticket to.'),
})

export type AgentTicketCreateFormValues = z.infer<typeof agentTicketCreateSchema>

export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Department name must be at least 2 characters.')
    .max(60, 'Department name is too long.'),
  routing: z
    .string()
    .trim()
    .max(120, 'Routing rule is too long.')
    .optional(),
})

export type DepartmentFormValues = z.infer<typeof departmentSchema>
