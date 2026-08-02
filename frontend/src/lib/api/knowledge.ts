import { mockArticles } from '@/mocks/data'
import type { KnowledgeArticle } from '@/types'
import { type Envelope, toDepartment, unwrap } from './adapters'
import { get, mockLatency, usesMockKnowledge } from './client'

interface BackendFaq {
  id: string
  question: string
  answer: string
  language: string
  category: string | null
  createdAt: string
  updatedAt: string
}

function toArticle(raw: BackendFaq): KnowledgeArticle {
  return {
    id: raw.id,
    title: raw.question,
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
  if (params?.category && params.category !== 'all' && article.category !== params.category) {
    return false
  }
  if (params?.status && params.status !== 'all' && article.status !== params.status) {
    return false
  }
  if (
    params?.query?.trim() &&
    !article.title.toLowerCase().includes(params.query.toLowerCase())
  ) {
    return false
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

    const raw = unwrap(await get<Envelope<BackendFaq[]>>('/kb/faq'))
    return raw.map(toArticle).filter((article) => matchesFilters(article, params))
  },
}
