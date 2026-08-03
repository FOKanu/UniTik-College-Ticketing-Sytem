import { describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { ApiError, isApiError, toApiError } from './errors'
import {
  getDataSourceMode,
  isMockDataSource,
  usesLiveAuth,
  usesLiveChat,
  usesMockKnowledge,
  usesMockNotifications,
} from './client'
import { ticketsApi } from './tickets'
import { usersApi } from './users'

describe('toApiError', () => {
  it('passes through existing ApiError instances', () => {
    const original = new ApiError('Nope', { code: 'FORBIDDEN', status: 403 })
    expect(toApiError(original)).toBe(original)
  })

  it('maps axios network failures', () => {
    const error = new axios.AxiosError('Network Error')
    error.code = 'ERR_NETWORK'
    const mapped = toApiError(error)
    expect(mapped.code).toBe('NETWORK')
    expect(isApiError(mapped)).toBe(true)
  })

  it('maps 401 responses', () => {
    const error = new axios.AxiosError('Unauthorized')
    error.response = {
      status: 401,
      data: { message: 'Token expired' },
      statusText: 'Unauthorized',
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
    }
    const mapped = toApiError(error)
    expect(mapped.code).toBe('UNAUTHORIZED')
    expect(mapped.message).toBe('Token expired')
    expect(mapped.status).toBe(401)
  })

  it('maps validation responses', () => {
    const error = new axios.AxiosError('Bad Request')
    error.response = {
      status: 422,
      data: { message: 'Subject is required' },
      statusText: 'Unprocessable Entity',
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
    }
    const mapped = toApiError(error)
    expect(mapped.code).toBe('VALIDATION')
  })
})

describe('data source modes', () => {
  it('defaults to mock under the test stub', () => {
    expect(getDataSourceMode()).toBe('mock')
    expect(isMockDataSource()).toBe(true)
    expect(usesLiveAuth()).toBe(false)
    expect(usesLiveChat()).toBe(false)
    expect(usesMockNotifications()).toBe(true)
    expect(usesMockKnowledge()).toBe(true)
  })

  it('treats hybrid as live auth/chat/knowledge with fixture notifications', () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'hybrid')
    expect(getDataSourceMode()).toBe('hybrid')
    expect(isMockDataSource()).toBe(false)
    expect(usesLiveAuth()).toBe(true)
    expect(usesLiveChat()).toBe(true)
    expect(usesMockNotifications()).toBe(true)
    expect(usesMockKnowledge()).toBe(false)
    vi.stubEnv('VITE_DATA_SOURCE', 'mock')
  })
})

describe('mock tickets API', () => {
  it('lists student tickets when mine=true', async () => {
    expect(isMockDataSource()).toBe(true)
    const result = await ticketsApi.listMine({ pageSize: 10 })
    expect(result.items.length).toBeGreaterThan(0)
    expect(result.items.every((t) => t.createdBy === 'user-1')).toBe(true)
  })

  it('returns NOT_FOUND for unknown ticket ids', async () => {
    await expect(ticketsApi.getById('TCK-MISSING')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    })
  })
})

describe('mock staff directory', () => {
  it('returns agent/admin accounts for assignee dropdowns', async () => {
    const staff = await usersApi.listStaff()
    expect(staff.length).toBeGreaterThan(0)
    expect(
      staff.every((m) => m.role === 'agent' || m.role === 'admin'),
    ).toBe(true)
  })

  it('filters mock staff by department substring', async () => {
    const itStaff = await usersApi.listStaff('IT')
    expect(itStaff.every((m) => (m.department ?? '').includes('IT'))).toBe(
      true,
    )
  })
})

describe('mock attachments API', () => {
  it('uploads and lists attachments on a mock ticket', async () => {
    const file = new File(['png-bytes'], 'screenshot.png', {
      type: 'image/png',
    })
    const uploaded = await ticketsApi.uploadAttachment('TCK-1042', file)
    expect(uploaded.name).toBe('screenshot.png')
    expect(uploaded.sizeLabel).toBeTruthy()

    const listed = await ticketsApi.listAttachments('TCK-1042')
    expect(listed.some((item) => item.id === uploaded.id)).toBe(true)

    await ticketsApi.deleteAttachment('TCK-1042', uploaded.id)
    const after = await ticketsApi.listAttachments('TCK-1042')
    expect(after.some((item) => item.id === uploaded.id)).toBe(false)
  })
})
