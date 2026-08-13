import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RouteTitle } from '@/app/RouteTitle'
import { ROUTES } from '@/app/routes'
import { LanguageSelector } from '@/components/layout/LanguageSelector'
import { IconCheck, IconChevronRight, IconSearch } from '@/components/ui/icons'
import { INSTITUTIONS } from '@/lib/institutions'
import { useInstitutionStore } from '@/stores'
import styles from './InstitutionPage.module.css'

const FEATURES = [
  'institution.featureRouting',
  'institution.featureAssistant',
  'institution.featureSla',
] as const

export function InstitutionPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const institutionId = useInstitutionStore((s) => s.institutionId)
  const setInstitutionId = useInstitutionStore((s) => s.setInstitutionId)
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(institutionId)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return INSTITUTIONS
    return INSTITUTIONS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.domains.toLowerCase().includes(q) ||
        item.short.toLowerCase().includes(q) ||
        item.locations.toLowerCase().includes(q) ||
        item.emailDomains.some((d) => d.toLowerCase().includes(q)),
    )
  }, [query])

  function selectInstitution(id: string) {
    setActiveId(id)
    setInstitutionId(id)
    void navigate(ROUTES.login)
  }

  return (
    <div className={styles.shell}>
      <RouteTitle />
      <a href="#institution-content" className={styles.skipLink}>
        {t('institution.skip')}
      </a>

      <aside className={styles.brandPanel} aria-label={t('institution.about')}>
        <div className={styles.brandTop}>
          <span className={styles.brandMark}>TH</span>
          <span className={styles.brandName}>TicketHub</span>
        </div>

        <div className={styles.brandBody}>
          <h1>{t('institution.title')}</h1>
          <p>{t('institution.description')}</p>
          <ul className={styles.features}>
            {FEATURES.map((feature) => (
              <li key={feature}>
                <IconCheck width={16} height={16} aria-hidden />
                <span>{t(feature)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className={styles.brandFooter}>
          {t('institution.trusted')}
        </p>
      </aside>

      <main id="institution-content" className={styles.main}>
        <div className={styles.langRow}>
          <LanguageSelector
            menuNote={t('language.more')}
          />
        </div>

        <div className={styles.content}>
          <header className={styles.header}>
            <h2>{t('institution.find')}</h2>
            <p>{t('institution.select')}</p>
          </header>

          <label className={styles.search} htmlFor="institution-search">
            <IconSearch width={18} height={18} aria-hidden />
            <input
              id="institution-search"
              type="search"
              placeholder={t('institution.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </label>

          <section className={styles.listSection} aria-label={t('institution.all')}>
            <h3 className={styles.listLabel}>{t('institution.all')}</h3>
            {filtered.length === 0 ? (
              <p className={styles.empty}>{t('institution.none', { query })}</p>
            ) : (
              <ul className={styles.list}>
                {filtered.map((item) => {
                  const active = activeId === item.id
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={
                          active ? styles.cardActive : styles.card
                        }
                        onClick={() => selectInstitution(item.id)}
                        onMouseEnter={() => setActiveId(item.id)}
                        onFocus={() => setActiveId(item.id)}
                      >
                        <span
                          className={styles.badge}
                          style={{ background: item.color }}
                          aria-hidden
                        >
                          {item.short}
                        </span>
                        <span className={styles.copy}>
                          <strong>{item.name}</strong>
                          <small>
                            {item.domains} · {item.locations}
                          </small>
                        </span>
                        <IconChevronRight
                          width={18}
                          height={18}
                          className={styles.chevron}
                          aria-hidden
                        />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <p className={styles.help}>
            {t('institution.missing')}
          </p>
        </div>
      </main>
    </div>
  )
}
