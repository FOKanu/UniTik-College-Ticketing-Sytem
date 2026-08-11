import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RouteTitle } from '@/app/RouteTitle'
import { ROUTES } from '@/app/routes'
import { LanguageSelector } from '@/components/layout/LanguageSelector'
import { ThemeSelector } from '@/components/layout/ThemeSelector'
import { IconCheck, IconChevronRight, IconSearch } from '@/components/ui/icons'
import { useT, type MessageKey } from '@/lib/i18n'
import { INSTITUTIONS } from '@/lib/institutions'
import { useInstitutionStore } from '@/stores'
import styles from './InstitutionPage.module.css'

const FEATURE_KEYS = [
  'auth.feature.routing',
  'auth.feature.ai',
  'auth.feature.sla',
] as const satisfies readonly MessageKey[]

export function InstitutionPage() {
  const t = useT()
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
        {t('auth.findInstitution')}
      </a>

      <aside className={styles.brandPanel} aria-label="About TicketHub">
        <div className={styles.brandTop}>
          <span className={styles.brandMark}>TH</span>
          <span className={styles.brandName}>TicketHub</span>
        </div>

        <div className={styles.brandBody}>
          <h1>{t('auth.heroTitle')}</h1>
          <p>{t('auth.heroBody')}</p>
          <ul className={styles.features}>
            {FEATURE_KEYS.map((key) => (
              <li key={key}>
                <IconCheck width={16} height={16} aria-hidden />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className={styles.brandFooter}>TicketHub</p>
      </aside>

      <main id="institution-content" className={styles.main}>
        <div className={styles.langRow}>
          <ThemeSelector />
          <LanguageSelector />
        </div>

        <div className={styles.content}>
          <header className={styles.header}>
            <h2>{t('auth.findInstitution')}</h2>
            <p>{t('auth.findHint')}</p>
          </header>

          <label className={styles.search} htmlFor="institution-search">
            <IconSearch width={18} height={18} aria-hidden />
            <input
              id="institution-search"
              type="search"
              placeholder={t('auth.searchInstitutions')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </label>

          <section className={styles.listSection} aria-label="Institutions">
            <h3 className={styles.listLabel}>{t('auth.allInstitutions')}</h3>
            {filtered.length === 0 ? (
              <p className={styles.empty}>
                {t('auth.noInstitutions', { query })}
              </p>
            ) : (
              <ul className={styles.list}>
                {filtered.map((item) => {
                  const active = activeId === item.id
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={active ? styles.cardActive : styles.card}
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

          <p className={styles.help}>{t('auth.cantFind')}</p>
        </div>
      </main>
    </div>
  )
}
