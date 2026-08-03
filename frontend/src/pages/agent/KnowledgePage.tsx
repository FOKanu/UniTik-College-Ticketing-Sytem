import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Badge,
  Button,
  Input,
  SearchField,
  Select,
  Textarea,
} from '@/components/ui'
import { knowledgeApi } from '@/lib/api'
import type { Department, KnowledgeArticle } from '@/types'
import styles from './KnowledgePage.module.css'

export function KnowledgePage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Department | 'all'>('all')
  const [visibility, setVisibility] = useState<'all' | 'published' | 'draft'>(
    'all',
  )
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Minimal staff-only "Add FAQ" form (POST /kb/faq).
  const [formOpen, setFormOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [newCategory, setNewCategory] = useState<Department>('IT')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await knowledgeApi.list()
        if (cancelled) return
        setArticles(data)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load the knowledge base. Check your connection and try again.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  function refresh() {
    setLoading(true)
    setError(null)
    setReloadKey((key) => key + 1)
  }

  const filtered = useMemo(() => {
    return articles.filter((article) => {
      if (category !== 'all' && article.category !== category) return false
      if (visibility !== 'all' && article.status !== visibility) return false
      if (
        query.trim() &&
        !article.title.toLowerCase().includes(query.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [articles, query, category, visibility])

  const hasCorpus = articles.length > 0

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!question.trim() || !answer.trim() || saving) return
    setSaving(true)
    setFormError(null)
    try {
      await knowledgeApi.create({
        question: question.trim(),
        answer: answer.trim(),
        category: newCategory,
      })
      setQuestion('')
      setAnswer('')
      setFormOpen(false)
      refresh()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Could not save the article.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Knowledge Base</h1>
          <p>Articles students and staff can use for self-service help.</p>
        </div>
        <Button
          size="sm"
          aria-expanded={formOpen}
          onClick={() => setFormOpen((v) => !v)}
        >
          {formOpen ? 'Close' : '+ New article'}
        </Button>
      </header>

      <div className={styles.banner} role="note">
        <strong>Publishing tip:</strong> Draft articles stay internal until you
        publish them. Published articles appear in the student FAQ and AI
        assistant suggestions.
      </div>

      {formOpen ? (
        <form className={styles.createForm} onSubmit={handleCreate}>
          <h2>New FAQ article</h2>
          <Input
            id="kb-new-question"
            label="Question"
            placeholder="e.g. How do I reset my university email password?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
          <Textarea
            id="kb-new-answer"
            label="Answer"
            placeholder="Write the answer students should see…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
          />
          <div className={styles.formRow}>
            <Select
              id="kb-new-category"
              aria-label="Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as Department)}
              options={[
                { value: 'IT', label: 'IT' },
                { value: 'Academics', label: 'Academics' },
                { value: 'Finance', label: 'Finance' },
                { value: 'Maintenance', label: 'Maintenance' },
              ]}
            />
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving…' : 'Publish article'}
            </Button>
          </div>
          {formError ? (
            <p className={styles.formError} role="alert">
              {formError}
            </p>
          ) : null}
        </form>
      ) : null}

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

      {error ? (
        <div className={styles.stateBox} role="alert">
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={refresh}>
            Try again
          </Button>
        </div>
      ) : null}

      <div className={styles.tableWrap}>
        <table className={styles.table} aria-busy={loading}>
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
            {!loading &&
              !error &&
              filtered.map((article) => (
                <tr key={article.id}>
                  <td>{article.title}</td>
                  <td>{article.category}</td>
                  <td>
                    <Badge
                      tone={
                        article.status === 'published' ? 'success' : 'neutral'
                      }
                    >
                      {article.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                  </td>
                  <td>
                    {/* View tracking is not implemented on the live API. */}
                    {article.views > 0 ? article.views.toLocaleString() : '—'}
                  </td>
                  <td>
                    {new Date(article.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            {loading ? (
              <tr>
                <td colSpan={5} className={styles.empty} aria-live="polite">
                  Loading articles…
                </td>
              </tr>
            ) : null}
            {!loading && !error && !hasCorpus ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  The knowledge base is empty. Use “+ New article” to publish
                  the first FAQ.
                </td>
              </tr>
            ) : null}
            {!loading && !error && hasCorpus && filtered.length === 0 ? (
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
