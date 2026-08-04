import { mockArticles } from '@/mocks/data'
import type { KnowledgeArticle } from '@/types'
import { get, isMockDataSource, mockLatency } from './client'

export const knowledgeApi = {
  async list(params?: {
    query?: string
    category?: string
    status?: 'all' | 'published' | 'draft'
  }): Promise<KnowledgeArticle[]> {
    if (isMockDataSource()) {
      await mockLatency(200)
      return mockArticles.filter((article) => {
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
        if (
          params?.query?.trim() &&
          !article.title.toLowerCase().includes(params.query.toLowerCase()) &&
          !article.body.toLowerCase().includes(params.query.toLowerCase()) &&
          !article.id.toLowerCase().includes(params.query.toLowerCase())
        ) {
          return false
        }
        return true
      })
    }

    return get<KnowledgeArticle[]>('/knowledge', { params })
  },
}
