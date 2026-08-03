import { mockAccounts } from '@/mocks/data'
import type { Department, UserRole } from '@/types'
import { type Envelope, unwrap } from './adapters'
import { get, mockLatency, usesLiveAuth } from './client'

export interface StaffMember {
  id: string
  email: string
  displayName: string
  role: 'STAFF' | 'ADMIN' | UserRole
  department: string | null
}

interface BackendStaffMember {
  id: string
  email: string
  displayName: string
  role: 'STAFF' | 'ADMIN'
  department: string | null
}

function usesLiveStaffDirectory(): boolean {
  // Staff directory ships with the users slice; keep it live whenever auth is.
  return usesLiveAuth()
}

function toStaffMember(raw: BackendStaffMember): StaffMember {
  return {
    id: raw.id,
    email: raw.email,
    displayName: raw.displayName,
    role: raw.role,
    department: raw.department,
  }
}

function mockStaff(department?: string): StaffMember[] {
  const members: StaffMember[] = mockAccounts
    .filter((account) => account.role === 'agent' || account.role === 'admin')
    .map((account) => ({
      id: account.id,
      email: account.email,
      displayName: account.displayName,
      role: account.role,
      department: account.department ?? null,
    }))

  // Extra mock agent used by the create-ticket Assign To fixture.
  if (!members.some((m) => m.id === 'agent-2')) {
    members.push({
      id: 'agent-2',
      email: 'r.diallo@campus.edu',
      displayName: 'R. Diallo',
      role: 'agent',
      department: 'Academics',
    })
  }

  if (!department) return members
  const needle = department.trim().toLowerCase()
  return members.filter((m) =>
    (m.department ?? '').toLowerCase().includes(needle),
  )
}

export const usersApi = {
  async listStaff(department?: Department | string): Promise<StaffMember[]> {
    if (!usesLiveStaffDirectory()) {
      await mockLatency()
      return mockStaff(department)
    }

    const query = department
      ? `?department=${encodeURIComponent(department)}`
      : ''
    const raw = unwrap(
      await get<Envelope<BackendStaffMember[]>>(`/users/staff${query}`),
    )
    return raw.map(toStaffMember)
  },

  async listDepartments(): Promise<string[]> {
    if (!usesLiveStaffDirectory()) {
      await mockLatency()
      return [
        ...new Set(
          mockStaff()
            .map((m) => m.department)
            .filter((d): d is string => !!d),
        ),
      ].sort()
    }

    return unwrap(await get<Envelope<string[]>>('/users/departments'))
  },
}
