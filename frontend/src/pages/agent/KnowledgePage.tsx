import { Fragment, useMemo, useState } from 'react'
import { Badge, Button, SearchField, Select } from '@/components/ui'
import { renderKnowledgeBody } from '@/lib/knowledge/renderBody'
import { mockArticles } from '@/mocks/data'
import type { Department } from '@/types'
import styles from './KnowledgePage.module.css'

export function KnowledgePage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Department | 'all'>('all')
  const [visibility, setVisibility] = useState<'all' | 'published' | 'draft'>(
    'all',
  )
  const [openId, setOpenId] = useState<string | null>(null)

  const articles = useMemo(() => {
    return mockArticles.filter((article) => {
      if (category !== 'all' && article.category !== category) return false
      if (visibility !== 'all' && article.status !== visibility) return false
      if (
        query.trim() &&
        !article.title.toLowerCase().includes(query.toLowerCase()) &&
        !article.body.toLowerCase().includes(query.toLowerCase()) &&
        !article.id.toLowerCase().includes(query.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [query, category, visibility])

  function toggle(id: string) {
    setOpenId((current) => (current === id ? null : id))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Knowledge Base</h1>
          <p>
            Canonical FAQ answers for student self-service and staff replies.
          </p>
        </div>
        <Button size="sm">+ New article</Button>
      </header>

      <div className={styles.banner} role="note">
        <strong>Publishing tip:</strong> Use the exact FAQ wording below when
        helping students. Published articles appear in the student FAQ and AI
        assistant suggestions.
      </div>

      <div className={styles.toolbar}>
        <Select
          id="kb-visibility"
          aria-label="Visibility"
          value={visibility}
          onChange={(e) =>
            setVisibility(e.target.value as 'all' | 'published' | 'draft')
          }
          options={[
            { value: 'all', label: 'Visibility: All' },
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
          ]}
        />
        <Select
          id="kb-cat"
          aria-label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Department | 'all')}
          options={[
            { value: 'all', label: 'Category: All' },
            { value: 'Academics', label: 'Academics' },
            { value: 'IT', label: 'IT' },
            { value: 'Finance', label: 'Finance' },
            { value: 'Maintenance', label: 'Maintenance' },
          ]}
        />
        <SearchField
          id="kb-search"
          placeholder="Search by title, FAQ ID, or answer text..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.search}
        />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="sr-only">Knowledge base articles</caption>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">FAQ ID</th>
              <th scope="col">Category</th>
              <th scope="col">Status</th>
              <th scope="col">Views</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => {
              const open = openId === article.id
              return (
                <Fragment key={article.id}>
                  <tr className={open ? styles.rowOpen : styles.row}>
                    <td>
                      <button
                        type="button"
                        className={styles.titleBtn}
                        aria-expanded={open}
                        aria-controls={`kb-answer-${article.id}`}
                        onClick={() => toggle(article.id)}
                      >
                        {article.title}
                      </button>
                    </td>
                    <td>
                      <code className={styles.faqId}>{article.id}</code>
                    </td>
                    <td>{article.category}</td>
                    <td>
                      <Badge
                        tone={
                          article.status === 'published' ? 'success' : 'neutral'
                        }
                      >
                        {article.status === 'published'
                          ? 'Published'
                          : 'Draft'}
                      </Badge>
                    </td>
                    <td>{article.views.toLocaleString()}</td>
                    <td>
                      {new Date(article.updatedAt).toLocaleDateString(
                        undefined,
                        {
                          month: 'short',
                          day: 'numeric',
                        },
                      )}
                    </td>
                  </tr>
                  {open ? (
                    <tr className={styles.answerRow}>
                      <td colSpan={6}>
                        <div
                          id={`kb-answer-${article.id}`}
                          className={styles.answer}
                        >
                          <h3>Canonical answer</h3>
                          <p>{renderKnowledgeBody(article.body)}</p>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
            {articles.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  No articles match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
