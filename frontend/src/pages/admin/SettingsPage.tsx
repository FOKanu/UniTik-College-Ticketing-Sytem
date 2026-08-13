import { useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/routes'
import {
  Badge,
  Button,
  ButtonLink,
  FileDropzone,
  Input,
  Toggle,
} from '@/components/ui'
import { mockArticles, mockStaffMembers } from '@/mocks/data'
import { findInstitution } from '@/lib/institutions'
import { useInstitutionStore, useUiStore } from '@/stores'
import type { Department } from '@/types'
import styles from './SettingsPage.module.css'

type SettingsTab = 'institution' | 'departments' | 'people' | 'knowledge'

const TABS: { id: SettingsTab; labelKey: string; to: string }[] = [
  { id: 'institution', labelKey: 'admin.institution', to: ROUTES.settings },
  {
    id: 'departments',
    labelKey: 'nav.departments',
    to: ROUTES.settingsDepartments,
  },
  { id: 'people', labelKey: 'nav.people', to: ROUTES.settingsPeople },
  {
    id: 'knowledge',
    labelKey: 'nav.knowledge',
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

const DEPARTMENT_OPTIONS: Department[] = [
  'Academics',
  'IT',
  'Finance',
  'Maintenance',
]

function tabFromPath(pathname: string): SettingsTab {
  if (pathname.includes('/departments')) return 'departments'
  if (pathname.includes('/people')) return 'people'
  if (pathname.includes('/knowledge')) return 'knowledge'
  return 'institution'
}

export function SettingsPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const tab = tabFromPath(location.pathname)
  const pushToast = useUiStore((s) => s.pushToast)
  const institutionId = useInstitutionStore((s) => s.institutionId)
  const institution = findInstitution(institutionId)

  const [displayName, setDisplayName] = useState(institution.name)
  const [shortCode, setShortCode] = useState(institution.short)
  const [emailDomains, setEmailDomains] = useState(
    institution.emailDomains.join(', '),
  )
  const [logoName, setLogoName] = useState<string | null>(null)
  const [langDe, setLangDe] = useState(true)
  const [langEn, setLangEn] = useState(true)
  const [staff, setStaff] = useState(() =>
    mockStaffMembers.map((member) => ({ ...member })),
  )

  const articles = useMemo(() => mockArticles, [])

  function updateStaffMember(
    id: string,
    patch: Partial<(typeof staff)[number]>,
  ) {
    setStaff((prev) =>
      prev.map((member) =>
        member.id === id ? { ...member, ...patch } : member,
      ),
    )
    const target = mockStaffMembers.find((member) => member.id === id)
    if (target) Object.assign(target, patch)
  }

  function saveStaffMember(id: string) {
    const member = staff.find((item) => item.id === id)
    if (!member) return
    pushToast({
      title: t('admin.staffUpdated'),
      body: `${member.name} → ${member.role}, ${member.department}.`,
      tone: 'success',
    })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{t('admin.settings')}</h1>
        <p>{t('admin.settingsDescription')}</p>
      </header>

      <nav className={styles.tabs} aria-label={t('admin.settings')}>
        {TABS.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.id === 'institution'}
            className={({ isActive }) =>
              isActive ? styles.tabActive : styles.tab
            }
          >
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>

      {tab === 'institution' ? (
        <section className={styles.panel} aria-labelledby="institution-heading">
          <h2 id="institution-heading">{t('admin.institution')}</h2>
          <div className={styles.form}>
            <Input
              id="inst-name"
              label={t('admin.displayName')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Input
              id="inst-code"
              label={t('admin.shortCode')}
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
            />
            <Input
              id="inst-domains"
              label={t('admin.emailDomains')}
              value={emailDomains}
              onChange={(e) => setEmailDomains(e.target.value)}
              hint="Comma-separated domains for student self-registration."
            />
            <div className={styles.logoField}>
              <span className={styles.label}>{t('admin.logo')}</span>
              <FileDropzone
                fileName={logoName}
                onChange={(file) => setLogoName(file?.name ?? null)}
              />
            </div>
            <div className={styles.toggles}>
              <Toggle
                id="lang-de"
                label={t('admin.german')}
                checked={langDe}
                onChange={setLangDe}
              />
              <Toggle
                id="lang-en"
                label={t('admin.english')}
                checked={langEn}
                onChange={setLangEn}
              />
            </div>
            <div className={styles.formActions}>
              <Button
                onClick={() =>
                  pushToast({
                    title: t('admin.saved'),
                    body: t('admin.savedBody'),
                    tone: 'success',
                  })
                }
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'departments' ? (
        <section className={styles.panel} aria-labelledby="depts-heading">
          <div className={styles.panelHead}>
            <h2 id="depts-heading">{t('nav.departments')}</h2>
            <Button size="sm">{t('admin.addDepartment')}</Button>
          </div>
          <div className={styles.banner} role="note">
            Keywords help the AI Assistant and auto-routing assign tickets to
            the right department queue.
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className="sr-only">{t('nav.departments')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('tickets.department')}</th>
                  <th scope="col">{t('common.agent')}</th>
                  <th scope="col">{t('adminDashboard.openTickets')}</th>
                  <th scope="col">{t('common.keywords')}</th>
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
            <h2 id="people-heading">{t('nav.people')}</h2>
            <Button size="sm">+ Invite staff</Button>
          </div>
          <div className={styles.banner} role="note">
            Change an employee&apos;s department or role here. Updates apply to
            ticket assignment lists in this demo session.
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className="sr-only">{t('nav.people')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('common.name')}</th><th scope="col">{t('common.email')}</th><th scope="col">{t('common.role')}</th><th scope="col">{t('tickets.department')}</th><th scope="col">{t('common.status')}</th><th scope="col">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((person) => (
                  <tr key={person.id}>
                    <td>{person.name}</td>
                    <td>{person.email}</td>
                    <td>
                      <select
                        className={styles.inlineSelect}
                        aria-label={`Role for ${person.name}`}
                        value={person.role}
                        onChange={(e) =>
                          updateStaffMember(person.id, {
                            role: e.target.value as 'Agent' | 'Admin',
                          })
                        }
                      >
                        <option value="Agent">{t('common.agent')}</option><option value="Admin">{t('common.admin')}</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className={styles.inlineSelect}
                        aria-label={`Department for ${person.name}`}
                        value={person.department}
                        onChange={(e) =>
                          updateStaffMember(person.id, {
                            department: e.target.value as Department,
                          })
                        }
                      >
                        {DEPARTMENT_OPTIONS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <Badge
                        tone={person.status === 'Active' ? 'success' : 'warn'}
                      >
                        {person.status}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => saveStaffMember(person.id)}
                      >
                        Save
                      </Button>
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
            <h2 id="kb-heading">{t('nav.knowledge')}</h2>
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
              <caption className="sr-only">{t('nav.knowledge')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('tickets.titleLabel')}</th><th scope="col">{t('common.category')}</th><th scope="col">{t('common.status')}</th>
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
            <Link to={ROUTES.knowledge}>{t('nav.knowledge')}</Link>
          </p>
        </section>
      ) : null}
    </div>
  )
}
