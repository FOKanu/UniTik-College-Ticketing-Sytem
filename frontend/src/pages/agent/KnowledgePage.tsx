import { useMemo, useState } from 'react'
import { Badge, Button, SearchField, Select } from '@/components/ui'
import { mockArticles } from '@/mocks/data'
import type { Department } from '@/types'
import styles from './KnowledgePage.module.css'

export function KnowledgePage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Department | 'all'>('all')
  const [visibility, setVisibility] = useState<'all' | 'published' | 'draft'>(
    'all',
  )

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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Knowledge Base</h1>
          <p>Articles students and staff can use for self-service help.</p>
        </div>
        <Button size="sm">+ New article</Button>
      </header>

      <div className={styles.banner} role="note">
        <strong>Publishing tip:</strong> Draft articles stay internal until you
        publish them. Published articles appear in the student FAQ and AI
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
          placeholder="Search articles by title or keyword..."
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
              <th scope="col">Category</th>
              <th scope="col">Status</th>
              <th scope="col">Views</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id}>
                <td>{article.title}</td>
                <td>{article.category}</td>
                <td>
                  <Badge
                    tone={article.status === 'published' ? 'success' : 'neutral'}
                  >
                    {article.status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                </td>
                <td>{article.views.toLocaleString()}</td>
                <td>
                  {new Date(article.updatedAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
              </tr>
            ))}
            {articles.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
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
