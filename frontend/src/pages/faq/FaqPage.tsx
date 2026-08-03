import { useEffect, useState } from 'react'
import { ROUTES } from '@/app/routes'
import { Button, ButtonLink, SearchField } from '@/components/ui'
import { knowledgeApi } from '@/lib/api'
import type { KnowledgeArticle } from '@/types'
import styles from './FaqPage.module.css'

const CATEGORIES = ['All', 'IT', 'Finance', 'Academics', 'Maintenance'] as const

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function FaqPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All')
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        // Students only see published entries; the FAQ API serves no drafts.
        const data = await knowledgeApi.list({ status: 'published' })
        if (cancelled) return
        setArticles(data)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof Error
            ? err.message
            : 'Could not load articles. Check your connection and try again.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  function retry() {
    setLoading(true)
    setError(null)
    setReloadKey((key) => key + 1)
  }

  const filtered = articles.filter((a) => {
    const matchesQuery = a.title.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === 'All' || a.category === category
    return matchesQuery && matchesCategory
  })

  const recentlyUpdated = [...articles]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 3)

  const hasCorpus = articles.length > 0
  const isFiltering = query.trim() !== '' || category !== 'All'

  return (
    <div className={styles.page}>
      <header>
        <h1>FAQ / Help Center</h1>
        <p>Browse popular articles or search for answers.</p>
      </header>

      <SearchField
        id="faq-search"
        placeholder="Search articles..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.search}
      />

      <div
        className={styles.categories}
        role="group"
        aria-label="Article categories"
      >
        {CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            className={category === item ? styles.pillActive : styles.pill}
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        <section className={styles.panel} aria-busy={loading}>
          <h2>Articles</h2>
          {loading ? (
            <p className={styles.empty} aria-live="polite">
              Loading articles…
            </p>
          ) : error ? (
            <div className={styles.stateBox} role="alert">
              <p>{error}</p>
              <Button variant="secondary" size="sm" onClick={retry}>
                Try again
              </Button>
            </div>
          ) : !hasCorpus ? (
            <div className={styles.stateBox}>
              <p>
                No articles have been published yet. Ask the AI Assistant or
                open a ticket — staff answers often become new articles.
              </p>
            </div>
          ) : filtered.length === 0 && isFiltering ? (
            <p className={styles.empty}>
              No articles match your search. Try different keywords or clear the
              category filter.
            </p>
          ) : (
            <ul>
              {filtered.map((article) => (
                <li key={article.id}>
                  <button
                    type="button"
                    aria-label={`Read article: ${article.title}`}
                  >
                    <strong>{article.title}</strong>
                    <span>
                      {article.category} · Updated{' '}
                      {formatUpdated(article.updatedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className={styles.rail}>
          <section className={styles.panel}>
            <h2>Recently updated</h2>
            {loading || error || recentlyUpdated.length === 0 ? (
              <p className={styles.empty}>
                {loading ? 'Loading…' : 'Nothing here yet.'}
              </p>
            ) : (
              <ol className={styles.mostAsked}>
                {recentlyUpdated.map((article, index) => (
                  <li key={article.id}>
                    <span className={styles.rank} aria-hidden="true">
                      {index + 1}
                    </span>
                    <button type="button">{article.title}</button>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className={styles.help}>
            <h2>Still need help?</h2>
            <p>Ask the AI Assistant or open a ticket with campus support.</p>
            <ButtonLink to={ROUTES.assistant}>Ask assistant</ButtonLink>
            <ButtonLink to={ROUTES.ticketNew} variant="secondary">
              Contact support
            </ButtonLink>
          </section>
        </aside>
      </div>
    </div>
  )
}
