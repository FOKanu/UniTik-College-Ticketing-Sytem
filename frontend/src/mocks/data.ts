import type {
  KnowledgeArticle,
  NotificationItem,
  Ticket,
  Department,
  User,
} from '@/types'

export const mockUser: User = {
  id: 'user-1',
  email: 'amara.k@stud.university.edu',
  displayName: 'Amara Kanu',
  role: 'student',
}

export const mockAccounts: User[] = [
  mockUser,
  {
    id: 'agent-1',
    email: 'agent@campus.edu',
    displayName: 'J. Novak',
    role: 'agent',
    department: 'IT',
  },
  {
    id: 'admin-1',
    email: 'admin@campus.edu',
    displayName: 'Sam Admin',
    role: 'admin',
    department: 'IT',
  },
]

export function findMockAccount(email: string): User | undefined {
  return mockAccounts.find(
    (account) => account.email.toLowerCase() === email.trim().toLowerCase(),
  )
}

export type StaffMemberStatus = 'Active' | 'Invited'

export interface StaffMember {
  id: string
  name: string
  email: string
  role: 'Agent' | 'Admin'
  department: Department
  status: StaffMemberStatus
}

/** Mutable staff roster used by admin People settings and ticket assignment. */
export const mockStaffMembers: StaffMember[] = [
  {
    id: 'agent-1',
    name: 'J. Novak',
    email: 'agent@campus.edu',
    role: 'Agent',
    department: 'IT',
    status: 'Active',
  },
  {
    id: 'agent-2',
    name: 'R. Diallo',
    email: 'r.diallo@campus.edu',
    role: 'Agent',
    department: 'Academics',
    status: 'Active',
  },
  {
    id: 'admin-1',
    name: 'Sam Admin',
    email: 'admin@campus.edu',
    role: 'Admin',
    department: 'IT',
    status: 'Active',
  },
  {
    id: 'agent-3',
    name: 'M. Keller',
    email: 'm.keller@campus.edu',
    role: 'Agent',
    department: 'Finance',
    status: 'Invited',
  },
]

export function findStaffMember(id: string): StaffMember | undefined {
  return mockStaffMembers.find((member) => member.id === id)
}

export function listAssignableStaff(department?: Department): StaffMember[] {
  return mockStaffMembers.filter(
    (member) =>
      member.status === 'Active' &&
      (member.role === 'Agent' || member.role === 'Admin') &&
      (!department || member.department === department),
  )
}

export const mockAgents = {
  'agent-1': { name: 'J. Novak', initials: 'JN' },
  'agent-2': { name: 'R. Diallo', initials: 'RD' },
} as const

export const mockTickets: Ticket[] = [
  {
    id: 'TCK-1042',
    subject: 'Cannot access exam portal',
    description:
      'I cannot log into the exam portal — it shows an authentication error after Chrome login.',
    category: 'IT',
    status: 'in_progress',
    priority: 'high',
    createdBy: 'user-1',
    requesterName: 'Amara Kanu',
    requesterEmail: 'amara.k@stud.university.edu',
    assignedTo: 'agent-1',
    assignedName: 'J. Novak',
    createdAt: '2026-07-20T09:12:00.000Z',
    updatedAt: '2026-07-21T11:05:00.000Z',
    slaHoursRemaining: 6,
    slaBreached: false,
    attachments: [{ id: 'a1', name: 'exam_error_screenshot.png' }],
    comments: [
      {
        id: 'cmt-1',
        ticketId: 'TCK-1042',
        authorId: 'agent-1',
        authorName: 'J. Novak',
        body: 'Hi Amara, thanks for reporting this. Which browser are you using?',
        createdAt: '2026-07-20T10:00:00.000Z',
      },
      {
        id: 'cmt-2',
        ticketId: 'TCK-1042',
        authorId: 'user-1',
        authorName: 'You',
        body: "I'm using Chrome on Windows 11.",
        createdAt: '2026-07-20T10:20:00.000Z',
      },
      {
        id: 'cmt-3',
        ticketId: 'TCK-1042',
        authorId: 'agent-1',
        authorName: 'J. Novak',
        body: "Thanks! I've escalated this to our IT team, expect an update within 24 hours.",
        createdAt: '2026-07-20T11:05:00.000Z',
      },
    ],
  },
  {
    id: 'TCK-1038',
    subject: 'Tuition refund not processed',
    description: 'Refund requested two weeks ago still shows as pending.',
    category: 'Finance',
    status: 'open',
    priority: 'medium',
    createdBy: 'user-1',
    requesterName: 'Amara Kanu',
    requesterEmail: 'amara.k@stud.university.edu',
    createdAt: '2026-07-18T14:30:00.000Z',
    updatedAt: '2026-07-18T14:30:00.000Z',
    comments: [],
  },
  {
    id: 'TCK-1021',
    subject: 'Broken AC in dorm room 214',
    description: 'Air conditioning unit stopped working overnight.',
    category: 'Maintenance',
    status: 'open',
    priority: 'high',
    createdBy: 'user-1',
    requesterName: 'Amara Kanu',
    createdAt: '2026-07-17T08:00:00.000Z',
    updatedAt: '2026-07-17T08:00:00.000Z',
    comments: [],
  },
  {
    id: 'TCK-1010',
    subject: 'Missing grade for Statistics II',
    description: 'Final exam grade still missing from the portal.',
    category: 'Academics',
    status: 'resolved',
    priority: 'low',
    createdBy: 'user-1',
    requesterName: 'Amara Kanu',
    assignedTo: 'agent-2',
    assignedName: 'R. Diallo',
    createdAt: '2026-07-10T08:00:00.000Z',
    updatedAt: '2026-07-12T16:40:00.000Z',
    comments: [],
  },
  {
    id: 'TCK-2091',
    subject: 'VPN not connecting off-campus',
    description: 'VPN fails to connect from home network since yesterday.',
    category: 'IT',
    status: 'open',
    priority: 'high',
    createdBy: 'user-2',
    requesterName: 'Amara Kanu',
    requesterEmail: 'amara.k@stud.university.edu',
    assignedTo: 'agent-1',
    assignedName: 'J. Novak',
    createdAt: '2026-07-20T07:00:00.000Z',
    updatedAt: '2026-07-20T07:00:00.000Z',
    slaHoursRemaining: -3,
    slaBreached: true,
    attachments: [{ id: 'a2', name: 'vpn_error_screenshot.png' }],
    comments: [
      {
        id: 'cmt-4',
        ticketId: 'TCK-2091',
        authorId: 'user-2',
        authorName: 'Amara Kanu',
        body: 'I tried reconnecting multiple times with no luck.',
        createdAt: '2026-07-20T07:10:00.000Z',
      },
    ],
  },
  {
    id: 'TCK-2090',
    subject: 'Email account locked out',
    description: 'Student email locked after password attempts.',
    category: 'IT',
    status: 'in_progress',
    priority: 'medium',
    createdBy: 'user-3',
    requesterName: 'Sam Lee',
    assignedTo: 'agent-1',
    assignedName: 'J. Novak',
    createdAt: '2026-07-19T12:00:00.000Z',
    updatedAt: '2026-07-20T09:00:00.000Z',
    slaHoursRemaining: 24,
    comments: [],
  },
  {
    id: 'TCK-2077',
    subject: 'Printer not working in Lab 3',
    description: 'Lab 3 printer shows offline.',
    category: 'Maintenance',
    status: 'open',
    priority: 'medium',
    createdBy: 'user-4',
    requesterName: 'Chris P.',
    assignedTo: undefined,
    createdAt: '2026-07-18T10:00:00.000Z',
    updatedAt: '2026-07-18T10:00:00.000Z',
    slaHoursRemaining: 48,
    comments: [],
  },
  {
    id: 'TCK-2060',
    subject: 'Laptop loaner request',
    description: 'Need a loaner laptop for exams next week.',
    category: 'IT',
    status: 'open',
    priority: 'low',
    createdBy: 'user-5',
    requesterName: 'Taylor M.',
    createdAt: '2026-07-16T09:00:00.000Z',
    updatedAt: '2026-07-16T09:00:00.000Z',
    slaHoursRemaining: 72,
    comments: [],
  },
]

export const mockArticles: KnowledgeArticle[] = [
  {
    id: 'faq-it-support-001',
    title: 'I forgot my university password.',
    body: 'Open [https://portal.university.example/support/it](https://portal.university.example/support/it), select Password Reset, enter your university email, complete identity verification, and follow the reset instructions. Then sign in to the Student Portal at [https://portal.university.example](https://portal.university.example) with the new password.',
    category: 'IT',
    status: 'published',
    views: 1840,
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'faq-it-support-002',
    title: 'How do I connect to the campus Wi-Fi?',
    body: 'Open [https://portal.university.example/support/it](https://portal.university.example/support/it) and select Campus Wi-Fi. Choose your device type, connect to the university wireless network named in the guide, authenticate with your Student Portal account, and accept the university network certificate when its details match the guide.',
    category: 'IT',
    status: 'published',
    views: 1520,
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'faq-registrar-004',
    title: 'How do I register for courses in the Student Portal?',
    body: 'Open [https://portal.university.example/registration](https://portal.university.example/registration), sign in, choose the term, search by subject or course number, add sections to your plan, and select Register. Review prerequisites, time conflicts, credits, and grading basis before confirming. A successful submission displays Registered and sends a portal confirmation.',
    category: 'Academics',
    status: 'published',
    views: 1310,
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'faq-academics-007',
    title: 'When is the add and drop deadline?',
    body: 'Open [https://portal.university.example/academic-calendar](https://portal.university.example/academic-calendar), select the academic year and term, and review the official add, drop, withdrawal, and late-withdrawal deadlines. Deadlines vary by term and course format, so the calendar date controls.',
    category: 'Academics',
    status: 'published',
    views: 980,
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'faq-finance-001',
    title: 'When is the tuition fee payment deadline?',
    body: 'Open [https://portal.university.example/finance](https://portal.university.example/finance), select Account and Deadlines, and choose the term. Review the invoice due date and pay through the listed synthetic payment methods before that date to avoid the published late-payment process.',
    category: 'Finance',
    status: 'published',
    views: 1120,
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'faq-registrar-020',
    title: 'How do I order an official transcript?',
    body: 'Open [https://portal.university.example/registrar/transcripts](https://portal.university.example/registrar/transcripts). Choose electronic or printed delivery, verify your identity and record details, enter the recipient, review any disclosed fee, and submit. Electronic requests are normally processed within one business day; printed requests are normally prepared within three business days before delivery.',
    category: 'Academics',
    status: 'published',
    views: 870,
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'faq-registrar-028',
    title: 'How do I obtain official enrollment verification?',
    body: 'Open [https://portal.university.example/registrar/enrollment-verification](https://portal.university.example/registrar/enrollment-verification). Choose the term and verification purpose, confirm the recipient, select electronic download or delivery, and submit. Current-term letters are normally available immediately after the enrollment census; custom letters take up to three business days.',
    category: 'Academics',
    status: 'published',
    views: 640,
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'faq-housing-003',
    title: 'How do I apply for university housing?',
    body: 'Open [https://portal.university.example/housing/apply](https://portal.university.example/housing/apply), sign in, choose the academic term, complete personal and roommate-profile details, rank room preferences, review the contract, and submit. A confirmation appears immediately. Housing communicates deposit and selection steps through the Student Portal.',
    category: 'Maintenance',
    status: 'published',
    views: 720,
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'faq-housing-020',
    title: 'How do I request a room change?',
    body: 'Open [https://portal.university.example/housing/room-change](https://portal.university.example/housing/room-change), select Request Room Change, describe the reason, indicate acceptable room types, and note any safety or accessibility concern. Meet with residential staff when requested. Routine requests are reviewed within ten business days and depend on available space; do not move until written approval.',
    category: 'Maintenance',
    status: 'published',
    views: 410,
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'faq-housing-046',
    title: 'How do I report a repair in university housing?',
    body: 'Open [https://portal.university.example/maintenance/housing](https://portal.university.example/maintenance/housing), select Routine Repair, provide the residence community and room, issue category, description, permission to enter, availability, and photos when useful, then submit. Maintenance owns repair execution and normally acknowledges routine requests within one business day.',
    category: 'Maintenance',
    status: 'published',
    views: 550,
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'faq-maintenance-006',
    title: 'How do I replace a lost student ID card?',
    body: 'Sign in at [https://portal.university.example](https://portal.university.example), select Profile, then Access Card, and choose Report Lost to deactivate the card immediately. Select Request Replacement and follow the identity-verification steps. For temporary access or technical problems, open [https://portal.university.example/support/it](https://portal.university.example/support/it).',
    category: 'IT',
    status: 'published',
    views: 990,
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'faq-registrar-001',
    title: 'Where can I find the academic calendar?',
    body: "Open the Academic Calendar at [https://portal.university.example/academic-calendar](https://portal.university.example/academic-calendar). Select the academic year and term to view class dates, add/drop and withdrawal deadlines, holidays, examinations, and grade deadlines. Dates shown there are the university's official deadlines.",
    category: 'Academics',
    status: 'published',
    views: 1450,
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
]

export const mockNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Ticket update',
    body: 'TCK-1042 is now In Progress',
    read: false,
    createdAt: '2026-07-21T11:05:00.000Z',
    ticketId: 'TCK-1042',
  },
  {
    id: 'n2',
    title: 'Agent reply',
    body: 'J. Novak replied to your ticket',
    read: false,
    createdAt: '2026-07-20T11:05:00.000Z',
    ticketId: 'TCK-1042',
  },
  {
    id: 'n3',
    title: 'Ticket resolved',
    body: 'TCK-1010 was marked resolved',
    read: true,
    createdAt: '2026-07-12T16:40:00.000Z',
    ticketId: 'TCK-1010',
  },
]

export const suggestedTopics = [
  'I forgot my university password.',
  'How do I connect to the campus Wi-Fi?',
  'When is the tuition fee payment deadline?',
]
