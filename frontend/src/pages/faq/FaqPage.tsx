import { useMemo, useState } from 'react'
import { ROUTES } from '@/app/routes'
import { ButtonLink, SearchField } from '@/components/ui'
import { mockArticles } from '@/mocks/data'
import styles from './FaqPage.module.css'

const CATEGORIES = ['All', 'IT', 'Finance', 'Academics', 'Maintenance'] as const

export function FaqPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All')

  const published = useMemo(
    () => mockArticles.filter((a) => a.status === 'published'),
    [],
  )

  const articles = published.filter((a) => {
    const matchesQuery = a.title.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === 'All' || a.category === category
    return matchesQuery && matchesCategory
  })

  const mostAsked = [...published]
    .sort((a, b) => b.views - a.views)
    .slice(0, 3)

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
        <section className={styles.panel}>
          <h2>Articles</h2>
          {articles.length === 0 ? (
            <p className={styles.empty}>No articles match your search.</p>
          ) : (
            <ul>
              {articles.map((article) => (
                <li key={article.id}>
                  <button
                    type="button"
                    aria-label={`Read article: ${article.title}`}
                  >
                    <strong>{article.title}</strong>
                    <span>
                      {article.category} · {article.views.toLocaleString()}{' '}
                      views
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className={styles.rail}>
          <section className={styles.panel}>
            <h2>Most asked</h2>
            <ol className={styles.mostAsked}>
              {mostAsked.map((article, index) => (
                <li key={article.id}>
                  <span className={styles.rank} aria-hidden="true">
                    {index + 1}
                  </span>
                  <button type="button">{article.title}</button>
                </li>
              ))}
            </ol>
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
