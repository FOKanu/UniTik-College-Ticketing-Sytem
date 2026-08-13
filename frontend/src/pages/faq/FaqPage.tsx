import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/routes'
import { Button, ButtonLink, SearchField } from '@/components/ui'
import { knowledgeApi } from '@/lib/api'
import { renderKnowledgeBody } from '@/lib/knowledge/renderBody'
import type { KnowledgeArticle } from '@/types'
import styles from './FaqPage.module.css'
import { browserLocale } from '@/i18n'

const CATEGORIES = ['All', 'IT', 'Finance', 'Academics', 'Maintenance'] as const
const CATEGORY_KEYS = {
  All: 'departments.all', IT: 'departments.it', Finance: 'departments.finance',
  Academics: 'departments.academics', Maintenance: 'departments.maintenance',
} as const

function formatUpdated(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })
}

export function FaqPage() {
  const { t, i18n } = useTranslation()
  const locale = browserLocale(i18n.resolvedLanguage)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All')
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [openId, setOpenId] = useState<string | null>(null)

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
            : t('faq.loadError'),
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [i18n.resolvedLanguage, reloadKey, t])

  function retry() {
    setLoading(true)
    setError(null)
    setReloadKey((key) => key + 1)
  }

  function toggleArticle(id: string) {
    setOpenId((current) => (current === id ? null : id))
  }

  const filtered = articles.filter((a) => {
    const q = query.toLowerCase()
    const matchesQuery =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.body.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
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
        <h1>{t('faq.heading')}</h1>
        <p>{t('faq.subtitle')}</p>
      </header>

      <SearchField
        id="faq-search"
        placeholder={t('faq.search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.search}
      />

      <div
        className={styles.categories}
        role="group"
        aria-label={t('faq.categories')}
      >
        {CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            className={category === item ? styles.pillActive : styles.pill}
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {t(CATEGORY_KEYS[item])}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        <section className={styles.panel} aria-busy={loading}>
          <h2>{t('faq.articles')}</h2>
          {loading ? (
            <p className={styles.empty} aria-live="polite">
              {t('faq.loading')}
            </p>
          ) : error ? (
            <div className={styles.stateBox} role="alert">
              <p>{error}</p>
              <Button variant="secondary" size="sm" onClick={retry}>
                {t('common.retry')}
              </Button>
            </div>
          ) : !hasCorpus ? (
            <div className={styles.stateBox}>
              <p>
                {t('faq.nonePublished')}
              </p>
            </div>
          ) : filtered.length === 0 && isFiltering ? (
            <p className={styles.empty}>
              {t('faq.noMatchesLong')}
            </p>
          ) : (
            <ul>
              {filtered.map((article) => {
                const open = openId === article.id
                return (
                  <li key={article.id}>
                    <button
                      type="button"
                      className={open ? styles.articleOpen : undefined}
                      aria-expanded={open}
                      aria-controls={`faq-answer-${article.id}`}
                      aria-label={t('faq.read', { title: article.title })}
                      onClick={() => toggleArticle(article.id)}
                    >
                      <strong>{article.title}</strong>
                      <span>
                        {t(CATEGORY_KEYS[article.category as keyof typeof CATEGORY_KEYS] ?? 'common.category')} · {t('faq.updated')}{' '}
                        {formatUpdated(article.updatedAt, locale)}
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
            <h2>{t('faq.recent')}</h2>
            {loading || error || recentlyUpdated.length === 0 ? (
              <p className={styles.empty}>
                {loading ? t('common.loading') : t('faq.nothing')}
              </p>
            ) : (
              <ol className={styles.mostAsked}>
                {recentlyUpdated.map((article, index) => (
                  <li key={article.id}>
                    <span className={styles.rank} aria-hidden="true">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleArticle(article.id)}
                    >
                      {article.title}
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className={styles.help}>
            <h2>{t('faq.stillNeedHelp')}</h2>
            <p>{t('faq.helpText')}</p>
            <ButtonLink to={ROUTES.assistant}>{t('faq.askAssistant')}</ButtonLink>
            <ButtonLink to={ROUTES.ticketNew} variant="secondary">
              {t('faq.contact')}
            </ButtonLink>
          </section>
        </aside>
      </div>
    </div>
  )
}
