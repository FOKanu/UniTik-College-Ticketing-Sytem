import { describe, expect, it } from 'vitest'
import axios from 'axios'
import { ApiError, isApiError, toApiError } from './errors'
import { isMockDataSource } from './client'
import { ticketsApi } from './tickets'

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
