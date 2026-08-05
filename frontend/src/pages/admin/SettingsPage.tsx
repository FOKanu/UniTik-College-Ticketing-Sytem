import { useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import {
  Badge,
  Button,
  ButtonLink,
  FileDropzone,
  Input,
  Toggle,
} from '@/components/ui'
import { mockArticles } from '@/mocks/data'
import { useInstitutionStore } from '@/stores/institutionStore'
import styles from './SettingsPage.module.css'

type SettingsTab = 'institution' | 'departments' | 'people' | 'knowledge'

const TABS: { id: SettingsTab; label: string; to: string }[] = [
  { id: 'institution', label: 'Institution', to: ROUTES.settings },
  {
    id: 'departments',
    label: 'Departments',
    to: ROUTES.settingsDepartments,
  },
  { id: 'people', label: 'People', to: ROUTES.settingsPeople },
  {
    id: 'knowledge',
    label: 'Knowledge Base',
    to: ROUTES.settingsKnowledge,
  },
]

const DEPARTMENTS = [
  {
    id: '1',
    name: 'Academics',
    agents: 4,
    openTickets: 9,
    keywords: 'grades, courses, exams',
  },
  {
    id: '2',
    name: 'IT',
    agents: 6,
    openTickets: 14,
    keywords: 'wifi, vpn, portal, email',
  },
  {
    id: '3',
    name: 'Finance',
    agents: 3,
    openTickets: 6,
    keywords: 'tuition, refund, invoice',
  },
  {
    id: '4',
    name: 'Maintenance',
    agents: 2,
    openTickets: 5,
    keywords: 'facilities, lab, printer',
  },
]

const STAFF = [
  {
    id: '1',
    name: 'J. Novak',
    email: 'agent@campus.edu',
    role: 'Agent',
    department: 'IT',
    status: 'Active' as const,
  },
  {
    id: '2',
    name: 'R. Diallo',
    email: 'r.diallo@campus.edu',
    role: 'Agent',
    department: 'Academics',
    status: 'Active' as const,
  },
  {
    id: '3',
    name: 'Sam Admin',
    email: 'admin@campus.edu',
    role: 'Admin',
    department: 'IT',
    status: 'Active' as const,
  },
  {
    id: '4',
    name: 'M. Keller',
    email: 'm.keller@campus.edu',
    role: 'Agent',
    department: 'Finance',
    status: 'Invited' as const,
  },
]

function tabFromPath(pathname: string): SettingsTab {
  if (pathname.includes('/departments')) return 'departments'
  if (pathname.includes('/people')) return 'people'
  if (pathname.includes('/knowledge')) return 'knowledge'
  return 'institution'
}

export function SettingsPage() {
  const location = useLocation()
  const tab = tabFromPath(location.pathname)
  const institution = useInstitutionStore((s) => s.institution)

  const [displayName, setDisplayName] = useState(institution.name)
  const [shortCode, setShortCode] = useState(institution.short)
  const [emailDomains, setEmailDomains] = useState(institution.domains)
  const [logoName, setLogoName] = useState<string | null>(null)
  const [langDe, setLangDe] = useState(true)
  const [langEn, setLangEn] = useState(true)

  const articles = useMemo(() => mockArticles, [])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Settings</h1>
        <p>Configure institution, departments, staff, and knowledge base.</p>
      </header>

      <nav className={styles.tabs} aria-label="Settings sections">
        {TABS.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.id === 'institution'}
            className={({ isActive }) =>
              isActive ? styles.tabActive : styles.tab
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {tab === 'institution' ? (
        <section className={styles.panel} aria-labelledby="institution-heading">
          <h2 id="institution-heading">Institution</h2>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <Input
              id="inst-name"
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Input
              id="inst-code"
              label="Short code"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
            />
            <Input
              id="inst-domains"
              label="Email domains"
              hint="Comma-separated domains allowed for student self-registration."
              value={emailDomains}
              onChange={(e) => setEmailDomains(e.target.value)}
            />
            <div className={styles.logoField}>
              <span className={styles.label}>Institution logo</span>
              <FileDropzone
                id="inst-logo"
                fileName={logoName}
                onChange={(file) => setLogoName(file?.name ?? null)}
              />
            </div>
            <fieldset className={styles.languages}>
              <legend>Languages</legend>
              <Toggle
                id="lang-de"
                label="Deutsch"
                checked={langDe}
                onChange={setLangDe}
              />
              <Toggle
                id="lang-en"
                label="English"
                checked={langEn}
                onChange={setLangEn}
              />
            </fieldset>
            <div className={styles.formActions}>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </section>
      ) : null}

      {tab === 'departments' ? (
        <section className={styles.panel} aria-labelledby="depts-heading">
          <div className={styles.panelHead}>
            <h2 id="depts-heading">Departments</h2>
            <Button size="sm">+ Add department</Button>
          </div>
          <div className={styles.banner} role="note">
            Keywords help the AI Assistant and auto-routing assign tickets to
            the right department queue.
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className="sr-only">Institution departments</caption>
              <thead>
                <tr>
                  <th scope="col">Department</th>
                  <th scope="col">Agents</th>
                  <th scope="col">Open tickets</th>
                  <th scope="col">Keywords</th>
                </tr>
              </thead>
              <tbody>
                {DEPARTMENTS.map((dept) => (
                  <tr key={dept.id}>
                    <td>{dept.name}</td>
                    <td>{dept.agents}</td>
                    <td>{dept.openTickets}</td>
                    <td className={styles.muted}>{dept.keywords}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === 'people' ? (
        <section className={styles.panel} aria-labelledby="people-heading">
          <div className={styles.panelHead}>
            <h2 id="people-heading">People</h2>
            <Button size="sm">+ Invite staff</Button>
          </div>
          <div className={styles.banner} role="note">
            Students self-register with an allowed institution email domain.
            Invite staff here to grant agent or admin access.
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className="sr-only">Staff members</caption>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Department</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {STAFF.map((person) => (
                  <tr key={person.id}>
                    <td>{person.name}</td>
                    <td>{person.email}</td>
                    <td>{person.role}</td>
                    <td>{person.department}</td>
                    <td>
                      <Badge
                        tone={person.status === 'Active' ? 'success' : 'warn'}
                      >
                        {person.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === 'knowledge' ? (
        <section className={styles.panel} aria-labelledby="kb-heading">
          <div className={styles.panelHead}>
            <h2 id="kb-heading">Knowledge Base</h2>
            <ButtonLink to={ROUTES.knowledge} size="sm">
              Open full knowledge base
            </ButtonLink>
          </div>
          <p className={styles.lead}>
            Manage visibility and categories from Settings, or open the full
            Knowledge Base page to draft and publish articles.
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className="sr-only">Knowledge articles overview</caption>
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Category</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.mutedNote}>
            Prefer the dedicated editor?{' '}
            <Link to={ROUTES.knowledge}>Go to Knowledge Base</Link>
          </p>
        </section>
      ) : null}
    </div>
  )
}
