import { describe, expect, it } from 'vitest'
import {
  buildCreateDraftFromMessages,
  isTicketCreateIntent,
  withCreateProposalMessage,
} from './ticketActionTypes'

describe('isTicketCreateIntent', () => {
  it('detects common create-ticket phrasing', () => {
    expect(isTicketCreateIntent('Can you create a ticket for me')).toBe(true)
    expect(isTicketCreateIntent('please open a support ticket')).toBe(true)
    expect(isTicketCreateIntent('I want to escalate this')).toBe(true)
    expect(isTicketCreateIntent('file a ticket about my VPN')).toBe(true)
  })

  it('ignores ordinary questions', () => {
    expect(isTicketCreateIntent('How do I appeal my exam grade?')).toBe(false)
    expect(isTicketCreateIntent('What is the VPN guide?')).toBe(false)
  })
})

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

  it('prefers the prior issue when the last turn is a create-ticket ask', () => {
    const draft = buildCreateDraftFromMessages([
      { id: 'u1', role: 'user', body: 'I received a grade I do not agree with' },
      { id: 'a1', role: 'assistant', body: 'You can file a grade appeal.' },
      { id: 'u2', role: 'user', body: 'Can you create the ticket for me' },
    ])
    expect(draft.subject).toBe('I received a grade I do not agree with')
    expect(draft.category).toBe('Academics')
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

describe('withCreateProposalMessage', () => {
  it('appends a pending create card from transcript context', () => {
    const next = withCreateProposalMessage([
      { id: 'u1', role: 'user', body: 'Printer is offline in Lab 3' },
      { id: 'a1', role: 'assistant', body: 'Try restarting the queue.' },
      { id: 'u2', role: 'user', body: 'create a ticket for me' },
    ])
    const card = next[next.length - 1]
    expect(card.action?.kind).toBe('create')
    expect(card.action?.status).toBe('pending')
    expect(card.action?.create?.subject).toContain('Printer')
    expect(card.action?.create?.category).toBe('IT')
  })

  it('does not open a second card while one is pending', () => {
    const first = withCreateProposalMessage([
      { id: 'u1', role: 'user', body: 'create a ticket' },
    ])
    const second = withCreateProposalMessage(first)
    expect(second).toHaveLength(first.length)
  })
})
