import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES, ticketDetailPath } from '@/app/routes'
import { ButtonLink, DepartmentBadge, StatusBadge } from '@/components/ui'
import { IconPlus } from '@/components/ui/icons'
import { useAuthStore, useTicketStore } from '@/stores'
import { knowledgeApi } from '@/lib/api'
import type { KnowledgeArticle } from '@/types'
import styles from './DashboardPage.module.css'

function relativeTime(iso: string, t: (key: string, options: { count: number }) => string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return t('time.minute', { count: Math.max(mins, 1) })
  const hours = Math.round(mins / 60)
  if (hours < 24) return t('time.hour', { count: hours })
  return t('time.day', { count: Math.round(hours / 24) })
}

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const user = useAuthStore((s) => s.user)
  const items = useTicketStore((s) => s.items)
  const setScope = useTicketStore((s) => s.setScope)
  const setFilters = useTicketStore((s) => s.setFilters)
  const fetchList = useTicketStore((s) => s.fetchList)
  const loading = useTicketStore((s) => s.loading)

  useEffect(() => {
    setScope('mine')
    setFilters({
      query: '',
      status: 'all',
      department: 'all',
      priority: 'all',
    })
    void fetchList({ page: 1, pageSize: 20 })
  }, [setScope, setFilters, fetchList])

  useEffect(() => {
    let cancelled = false
    void knowledgeApi.list({ status: 'published' }).then((items) => {
      if (!cancelled) setArticles(items.slice(0, 3))
    }).catch(() => {
      if (!cancelled) setArticles([])
    })
    return () => { cancelled = true }
  }, [i18n.resolvedLanguage])

  const open = items.filter((t) => t.status === 'open').length
  const inProgress = items.filter((t) => t.status === 'in_progress').length
  const resolved = items.filter((t) => t.status === 'resolved').length
  const firstName = user?.displayName?.split(' ')[0] ?? t('dashboard.student')
  const active = items.filter(
    (t) => t.status === 'open' || t.status === 'in_progress',
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t('dashboard.welcome', { name: firstName })}</h1>
          <p>{t('dashboard.description')}</p>
        </div>
        <ButtonLink to={ROUTES.ticketNew}>
          <IconPlus width={18} height={18} />
          {t('tickets.new')}
        </ButtonLink>
      </header>

      <section className={styles.stats} aria-label={t('dashboard.summary')}>
        <article className={styles.statOpen}>
          <span>{t('common.open')}</span>
          <strong>{loading ? '…' : open}</strong>
        </article>
        <article className={styles.statProgress}>
          <span>{t('common.inProgress')}</span>
          <strong>{loading ? '…' : inProgress}</strong>
        </article>
        <article className={styles.statResolved}>
          <span>{t('common.resolved')}</span>
          <strong>{loading ? '…' : resolved}</strong>
        </article>
      </section>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>{t('dashboard.active')}</h2>
            <Link to={ROUTES.tickets}>{t('dashboard.viewAll')}</Link>
          </div>
          {active.length === 0 && !loading ? (
            <p className={styles.empty}>{t('dashboard.noActive')}</p>
          ) : (
            <ul className={styles.list}>
              {(active.length ? active : items).slice(0, 5).map((ticket) => (
                <li key={ticket.id}>
                  <Link to={ticketDetailPath(ticket.id)} className={styles.item}>
                    <div className={styles.itemTop}>
                      <strong>{ticket.subject}</strong>
                      <time dateTime={ticket.updatedAt}>
                        {relativeTime(ticket.updatedAt, t)}
                      </time>
                    </div>
                    <div className={styles.badges}>
                      <DepartmentBadge department={ticket.category} />
                      <StatusBadge status={ticket.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className={styles.aside}>
          <section className={styles.panel}>
            <h2>{t('dashboard.suggested')}</h2>
            <ul className={styles.articles}>
              {(articles.length ? articles.map((article) => article.title) : [t('chatbot.topics.password'), t('chatbot.topics.wifi'), t('chatbot.topics.tuition')]).map((title) => (
                <li key={title}><Link to={ROUTES.faq}>{title}<span aria-hidden="true">›</span></Link></li>
              ))}
            </ul>
          </section>

          <section className={styles.aiCard}>
            <h2>{t('dashboard.quick')}</h2>
            <p>{t('dashboard.quickBody')}</p>
            <ButtonLink to={ROUTES.assistant} variant="secondary">
              {t('dashboard.openChat')}
            </ButtonLink>
          </section>
        </aside>
      </div>
    </div>
  )
}
