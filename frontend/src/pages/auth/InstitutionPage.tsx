import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RouteTitle } from '@/app/RouteTitle'
import { ROUTES } from '@/app/routes'
import { LanguageSelector } from '@/components/layout/LanguageSelector'
import { IconCheck, IconChevronRight, IconSearch } from '@/components/ui/icons'
import { INSTITUTIONS } from '@/lib/institutions'
import { useInstitutionStore } from '@/stores/institutionStore'
import styles from './InstitutionPage.module.css'

const FEATURES = [
  'Department-based routing',
  'AI assistant with knowledge base',
  'SLA tracking and reporting',
] as const

export function InstitutionPage() {
  const navigate = useNavigate()
  const setInstitution = useInstitutionStore((s) => s.setInstitution)
  const currentInstitutionId = useInstitutionStore((s) => s.institutionId)
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<string | null>(currentInstitutionId)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return INSTITUTIONS
    return INSTITUTIONS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.domains.toLowerCase().includes(q) ||
        item.short.toLowerCase().includes(q) ||
        item.locations.toLowerCase().includes(q),
    )
  }, [query])

  function selectInstitution(id: string) {
    setActiveId(id)
    setInstitution(id)
    void navigate(ROUTES.login)
  }

  return (
    <div className={styles.shell}>
      <RouteTitle />
      <a href="#institution-content" className={styles.skipLink}>
        Skip to institution list
      </a>

      <aside className={styles.brandPanel} aria-label="About TicketHub">
        <div className={styles.brandTop}>
          <span className={styles.brandMark}>TH</span>
          <span className={styles.brandName}>TicketHub</span>
        </div>

        <div className={styles.brandBody}>
          <h1>Support platform for higher education</h1>
          <p>
            TicketHub connects students and staff with campus IT, facilities,
            and academic support — routed to the right department every time.
          </p>
          <ul className={styles.features}>
            {FEATURES.map((feature) => (
              <li key={feature}>
                <IconCheck width={16} height={16} aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className={styles.brandFooter}>
          Trusted by institutions across Europe
        </p>
      </aside>

      <main id="institution-content" className={styles.main}>
        <div className={styles.langRow}>
          <LanguageSelector
            menuNote="More languages are enabled per institution."
          />
        </div>

        <div className={styles.content}>
          <header className={styles.header}>
            <h2>Find your institution</h2>
            <p>Select the university or college you belong to.</p>
          </header>

          <label className={styles.search} htmlFor="institution-search">
            <IconSearch width={18} height={18} aria-hidden />
            <input
              id="institution-search"
              type="search"
              placeholder="Search by name or email domain..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </label>

          <section className={styles.listSection} aria-label="Institutions">
            <h3 className={styles.listLabel}>All institutions</h3>
            {filtered.length === 0 ? (
              <p className={styles.empty}>No institutions match “{query}”.</p>
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
            Can&apos;t find your institution? Ask your IT department whether
            TicketHub is enabled.
          </p>
        </div>
      </main>
    </div>
  )
}
