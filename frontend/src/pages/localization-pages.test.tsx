import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { knowledgeApi } from '@/lib/api'
import { useAuthStore, useTicketStore } from '@/stores'
import type { KnowledgeArticle } from '@/types'
import { DashboardPage } from './dashboard/DashboardPage'
import { FaqPage } from './faq/FaqPage'

const english: KnowledgeArticle = {
  id: 'faq-academics-001',
  title: 'How do I update my address or phone number?',
  body: 'Open the student record correction form.',
  category: 'Academics',
  status: 'published',
  views: 1,
  updatedAt: '2026-08-01T00:00:00Z',
}

const german: KnowledgeArticle = {
  ...english,
  title: 'Wie aktualisiere ich meine Adresse oder Telefonnummer?',
  body: 'Öffnen Sie das Formular zur Korrektur der Studierendendaten.',
}

describe('localized full pages', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    await i18n.changeLanguage('en')
  })

  it('renders the student dashboard chrome and suggestions in German', async () => {
    await i18n.changeLanguage('de')
    vi.spyOn(knowledgeApi, 'list').mockResolvedValue([german])
    useAuthStore.setState({
      user: { id: 'student-1', email: 'jordan@example.edu', displayName: 'Jordan Alvarez', role: 'student' },
    })
    useTicketStore.setState({
      items: [], total: 0, loading: false, fetchList: vi.fn(async () => undefined),
    })

    render(<MemoryRouter><DashboardPage /></MemoryRouter>)

    expect(screen.getByText('Willkommen zurück, Jordan')).toBeInTheDocument()
    expect(screen.getByText('Neues Ticket')).toBeInTheDocument()
    expect(screen.getByText('Offen')).toBeInTheDocument()
    expect(screen.getByText('Aktive Tickets')).toBeInTheDocument()
    expect(screen.getByText('Empfohlene Artikel')).toBeInTheDocument()
    expect(screen.queryByText('Welcome back, Jordan')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(german.title)).toBeInTheDocument())
  })

  it.each([
    ['de', german, english],
    ['en', english, german],
  ] as const)('renders %s FAQ content without the other language', async (language, article, absent) => {
    await i18n.changeLanguage(language)
    vi.spyOn(knowledgeApi, 'list').mockResolvedValue([article])

    render(<MemoryRouter><FaqPage /></MemoryRouter>)

    const titles = await screen.findAllByText(article.title)
    expect(screen.queryByText(absent.title)).not.toBeInTheDocument()
    if (language === 'de') {
      expect(screen.getByRole('button', { name: 'Alle' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Finanzen' })).toBeInTheDocument()
    }
    fireEvent.click(titles[0].closest('button')!)
    expect(screen.getByText(article.body)).toBeInTheDocument()
  })

  it('refetches FAQ content immediately when the active language changes', async () => {
    await i18n.changeLanguage('en')
    const list = vi.spyOn(knowledgeApi, 'list').mockImplementation(async () =>
      i18n.resolvedLanguage === 'de' ? [german] : [english],
    )

    render(<MemoryRouter><FaqPage /></MemoryRouter>)
    expect(await screen.findAllByText(english.title)).not.toHaveLength(0)

    await act(async () => {
      await i18n.changeLanguage('de')
    })

    expect(await screen.findAllByText(german.title)).not.toHaveLength(0)
    expect(screen.queryByText(english.title)).not.toBeInTheDocument()
    expect(list).toHaveBeenCalledTimes(2)
  })
})
