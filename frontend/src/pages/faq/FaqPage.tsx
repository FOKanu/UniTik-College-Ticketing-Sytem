import { useMemo, useState } from 'react'
import { ROUTES } from '@/app/routes'
import { ButtonLink, SearchField } from '@/components/ui'
import { renderKnowledgeBody } from '@/lib/knowledge/renderBody'
import { mockArticles } from '@/mocks/data'
import styles from './FaqPage.module.css'

const CATEGORIES = ['All', 'IT', 'Finance', 'Academics', 'Maintenance'] as const

export function FaqPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All')
  const [openId, setOpenId] = useState<string | null>(null)

  const published = useMemo(
    () => mockArticles.filter((a) => a.status === 'published'),
    [],
  )

  const articles = published.filter((a) => {
    const q = query.toLowerCase()
    const matchesQuery =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.body.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    const matchesCategory = category === 'All' || a.category === category
    return matchesQuery && matchesCategory
  })

  const mostAsked = [...published]
    .sort((a, b) => b.views - a.views)
    .slice(0, 3)

  function toggleArticle(id: string) {
    setOpenId((current) => (current === id ? null : id))
  }

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
              {articles.map((article) => {
                const open = openId === article.id
                return (
                  <li key={article.id}>
                    <button
                      type="button"
                      className={open ? styles.articleOpen : undefined}
                      aria-expanded={open}
                      aria-controls={`faq-answer-${article.id}`}
                      onClick={() => toggleArticle(article.id)}
                    >
                      <strong>{article.title}</strong>
                      <span>
                        {article.category} · {article.id}
                      </span>
                    </button>
                    {open ? (
                      <div
                        id={`faq-answer-${article.id}`}
                        className={styles.answer}
                      >
                        <p>{renderKnowledgeBody(article.body)}</p>
                      </div>
                    ) : null}
                  </li>
                )
              })}
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
                  <button type="button" onClick={() => toggleArticle(article.id)}>
                    {article.title}
                  </button>
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
