import { mockArticles } from '@/mocks/data'
import type { KnowledgeArticle } from '@/types'
import { type Envelope, toDepartment, unwrap } from './adapters'
import { get, mockLatency, post, usesMockKnowledge } from './client'
import { ApiError } from './errors'
import i18n from '@/i18n'

interface BackendFaq {
  id: string
  documentId: string
  question: string
  answer: string
  language: string
  category: string | null
  createdAt: string
  updatedAt: string
}

function toArticle(raw: BackendFaq): KnowledgeArticle {
  return {
    id: raw.documentId,
    title: raw.question,
    body: raw.answer,
    category: toDepartment(raw.category),
    // The FAQ table has no draft state or view counter; everything it serves
    // is live, and view tracking is not implemented.
    status: 'published',
    views: 0,
    updatedAt: raw.updatedAt,
  }
}

function matchesFilters(
  article: KnowledgeArticle,
  params?: { query?: string; category?: string; status?: string },
): boolean {
  if (
    params?.category &&
    params.category !== 'all' &&
    article.category !== params.category
  ) {
    return false
  }
  if (
    params?.status &&
    params.status !== 'all' &&
    article.status !== params.status
  ) {
    return false
  }
  if (params?.query?.trim()) {
    const q = params.query.toLowerCase()
    const haystack = `${article.title} ${article.body} ${article.id}`.toLowerCase()
    if (!haystack.includes(q)) return false
  }
  return true
}

export const knowledgeApi = {
  async list(params?: {
    query?: string
    category?: string
    status?: 'all' | 'published' | 'draft'
  }): Promise<KnowledgeArticle[]> {
    if (usesMockKnowledge()) {
      await mockLatency(200)
      return mockArticles.filter((article) => matchesFilters(article, params))
    }

    const language = i18n.resolvedLanguage?.startsWith('de') ? 'de' : 'en'
    const raw = unwrap(await get<Envelope<BackendFaq[]>>(`/kb/faq?language=${language}`))
    return raw
      .map(toArticle)
      .filter((article) => matchesFilters(article, params))
  },

  /** Staff/admin only — the backend enforces the role. */
  async create(data: {
    question: string
    answer: string
    category?: string | null
  }): Promise<KnowledgeArticle> {
    if (usesMockKnowledge()) {
      // Honest failure: mock mode has no persistence, so don't pretend.
      throw new ApiError(
        'Connect the backend (VITE_DATA_SOURCE=hybrid) to add articles.',
        { code: 'UNKNOWN' },
      )
    }
    const raw = unwrap(
      await post<Envelope<BackendFaq>>('/kb/faq', {
        question: data.question,
        answer: data.answer,
        category: data.category ?? null,
        language: i18n.resolvedLanguage?.startsWith('de') ? 'de' : 'en',
      }),
    )
    return toArticle(raw)
  },
}
