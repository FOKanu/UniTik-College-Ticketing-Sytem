import { describe, expect, it } from 'vitest'
import { buildCreateDraftFromMessages } from './ticketActionTypes'

describe('buildCreateDraftFromMessages', () => {
  it('uses the latest user message as the subject', () => {
    const draft = buildCreateDraftFromMessages([
      { id: 'welcome', role: 'assistant', body: 'Hi' },
      { id: 'u1', role: 'user', body: 'VPN will not connect from home' },
      { id: 'a1', role: 'assistant', body: 'Try the campus VPN guide.' },
    ])
    expect(draft.subject).toBe('VPN will not connect from home')
    expect(draft.description).toContain('User: VPN will not connect from home')
    expect(draft.category).toBe('IT')
    expect(draft.priority).toBe('medium')
  })

  it('truncates long subjects', () => {
    const long = 'x'.repeat(100)
    const draft = buildCreateDraftFromMessages([
      { id: 'u1', role: 'user', body: long },
    ])
    expect(draft.subject.length).toBeLessThanOrEqual(80)
    expect(draft.subject.endsWith('…')).toBe(true)
  })
})
