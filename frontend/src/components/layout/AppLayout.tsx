import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RouteTitle } from '@/app/RouteTitle'
import { ROUTES } from '@/app/routes'
import { ChatbotFab } from '@/components/layout/ChatbotFab'
import { LanguageSelector } from '@/components/layout/LanguageSelector'
import { RouteErrorBoundary } from '@/components/errors'
import { NotificationCenter, ToastHost } from '@/components/notifications'
import { Avatar } from '@/components/ui'
import {
  IconBook,
  IconChart,
  IconChat,
  IconClose,
  IconDashboard,
  IconMenu,
  IconSettings,
  IconTicket,
  IconUser,
} from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'
import { useInstitutionStore } from '@/stores/institutionStore'
import type { UserRole } from '@/types'
import { findInstitution } from '@/lib/institutions'
import styles from './AppLayout.module.css'

interface NavItem {
  to: string
  labelKey: string
  icon: ReactNode
  end?: boolean
  soon?: boolean
}

const SIDEBAR_KEY = 'tickethub.sidebar.collapsed'

const studentNav: NavItem[] = [
  { to: ROUTES.dashboard, labelKey: 'nav.dashboard', icon: <IconDashboard />, end: true },
  { to: ROUTES.tickets, labelKey: 'nav.myTickets', icon: <IconTicket /> },
  { to: ROUTES.assistant, labelKey: 'nav.assistant', icon: <IconChat /> },
  { to: ROUTES.faq, labelKey: 'nav.faq', icon: <IconBook /> },
  { to: ROUTES.profile, labelKey: 'nav.profile', icon: <IconUser /> },
]

const staffNav: NavItem[] = [
  { to: ROUTES.agent, labelKey: 'nav.dashboard', icon: <IconDashboard />, end: true },
  { to: ROUTES.queue, labelKey: 'nav.queue', icon: <IconTicket /> },
  { to: ROUTES.knowledge, labelKey: 'nav.knowledge', icon: <IconBook /> },
  { to: ROUTES.analytics, labelKey: 'nav.analytics', icon: <IconChart />, soon: true },
  { to: ROUTES.profile, labelKey: 'nav.profile', icon: <IconUser /> },
]

const adminNav: NavItem[] = [
  { to: ROUTES.admin, labelKey: 'nav.dashboard', icon: <IconDashboard />, end: true },
  { to: ROUTES.queue, labelKey: 'nav.queue', icon: <IconTicket /> },
  { to: ROUTES.knowledge, labelKey: 'nav.knowledge', icon: <IconBook /> },
  { to: ROUTES.analytics, labelKey: 'nav.analytics', icon: <IconChart />, soon: true },
  { to: ROUTES.profile, labelKey: 'nav.profile', icon: <IconUser /> },
  { to: ROUTES.settings, labelKey: 'nav.settings', icon: <IconSettings /> },
]

function navForRole(role: UserRole | null | undefined): NavItem[] {
  if (role === 'admin') return adminNav
  if (role === 'agent') return staffNav
  return studentNav
}

function homeForRole(role: UserRole | null | undefined): string {
  if (role === 'admin') return ROUTES.admin
  if (role === 'agent') return ROUTES.agent
  return ROUTES.dashboard
}

function portalLabelKey(role: UserRole | null | undefined): string {
  if (role === 'admin') return 'portal.admin'
  if (role === 'agent') return 'portal.staff'
  return 'portal.student'
}

function pageTitle(pathname: string): string {
  if (pathname.startsWith('/tickets/') && pathname !== ROUTES.ticketNew) {
    return 'nav.ticketDetail'
  }
  if (pathname.startsWith('/agent/tickets/') && pathname !== ROUTES.agentTicketNew) {
    return 'nav.ticketResolution'
  }
  if (pathname.startsWith('/admin/settings/people')) return 'nav.people'
  if (pathname.startsWith('/admin/settings')) return 'nav.settings'
  const map: Record<string, string> = {
    [ROUTES.dashboard]: 'nav.dashboard', [ROUTES.tickets]: 'nav.myTickets', [ROUTES.ticketNew]: 'nav.createTicket',
    [ROUTES.assistant]: 'nav.assistant', [ROUTES.faq]: 'nav.faq', [ROUTES.notifications]: 'nav.notifications',
    [ROUTES.profile]: 'nav.profile', [ROUTES.agent]: 'nav.dashboard', [ROUTES.queue]: 'nav.queue',
    [ROUTES.agentTicketNew]: 'nav.createTicket', [ROUTES.knowledge]: 'nav.knowledge', [ROUTES.analytics]: 'nav.analytics',
    [ROUTES.admin]: 'nav.dashboard', [ROUTES.departments]: 'nav.departments', [ROUTES.settings]: 'nav.settings',
    [ROUTES.settingsPeople]: 'nav.people', [ROUTES.settingsDepartments]: 'nav.settings', [ROUTES.settingsKnowledge]: 'nav.settings',
  }
  return map[pathname] ?? 'TicketHub'
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const institutionId = useInstitutionStore((s) => s.institutionId)
  const institution = findInstitution(institutionId)
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerPath, setDrawerPath] = useState(location.pathname)

  // Close mobile drawer when the route changes (adjust state during render).
  if (drawerPath !== location.pathname) {
    setDrawerPath(location.pathname)
    if (drawerOpen) setDrawerOpen(false)
  }

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  const navItems = navForRole(user?.role)
  const homePath = homeForRole(user?.role)
  const titleKey = pageTitle(location.pathname)
  const title = titleKey === 'TicketHub' ? titleKey : t(titleKey)
  const mobileNav =
    user?.role === 'student'
      ? studentNav.slice(0, 4)
      : navItems.slice(0, 4)

  function renderNav(compact: boolean) {
    return navItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        title={compact ? t(item.labelKey) : undefined}
        className={({ isActive }) =>
          [
            isActive ? styles.navActive : styles.navLink,
            item.soon ? styles.navSoon : '',
            compact ? styles.navCompact : '',
          ]
            .filter(Boolean)
            .join(' ')
        }
        onClick={(e) => {
          if (item.soon) e.preventDefault()
        }}
        aria-disabled={item.soon || undefined}
      >
        <span className={styles.navIcon}>{item.icon}</span>
        {!compact ? (
          <>
            <span className={styles.navLabel}>{t(item.labelKey)}</span>
            {item.soon ? <span className={styles.soon}>{t('common.soon')}</span> : null}
          </>
        ) : null}
      </NavLink>
    ))
  }

  return (
    <div
      className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ''}`}
    >
      <RouteTitle />
      <a href="#main-content" className={styles.skipLink}>
        {t('nav.skip')}
      </a>

      {drawerOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label={t('nav.closeMenu')}
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <aside
        className={`${styles.sidebar} ${drawerOpen ? styles.sidebarOpen : ''}`}
        aria-label={t('nav.primary')}
      >
        <div className={styles.brandRow}>
          <Link to={homePath} className={styles.brand}>
            <span
              className={styles.logo}
              style={{ background: institution.color }}
            >
              {institution.short}
            </span>
            {!collapsed ? (
              <span className={styles.brandText}>
                <strong>{institution.short}</strong>
                <small>TicketHub</small>
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            className={styles.drawerClose}
            aria-label={t('nav.closeMenu')}
            onClick={() => setDrawerOpen(false)}
          >
            <IconClose width={18} height={18} />
          </button>
        </div>

        <nav className={styles.sideNav}>{renderNav(collapsed)}</nav>

        <div className={styles.sideFooter}>
          {!collapsed ? (
            <div className={styles.langInDrawer}>
              <LanguageSelector />
            </div>
          ) : null}
          <p className={styles.portal}>{t(portalLabelKey(user?.role))}</p>
          {!collapsed && user ? (
            <Link to={ROUTES.profile} className={styles.userCard}>
              <Avatar
                name={user.displayName}
                size="sm"
                color={user.avatarColor}
              />
              <span>
                <strong>{user.displayName}</strong>
                <small>{user.role}</small>
              </span>
            </Link>
          ) : null}
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>
      </aside>

      <div className={styles.mainCol}>
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <button
              type="button"
              className={styles.menuBtn}
              aria-label={t('nav.openMenu')}
              onClick={() => setDrawerOpen(true)}
            >
              <IconMenu width={20} height={20} />
            </button>
            <div>
              <h1 className={styles.pageTitle}>{title}</h1>
              <p className={styles.institution}>{institution.name}</p>
            </div>
          </div>
          <div className={styles.topRight}>
            <div className={styles.langDesktop}>
              <LanguageSelector />
            </div>
            <NotificationCenter />
            <Link
              to={ROUTES.profile}
              className={styles.avatarBtn}
              title={t('nav.openProfile')}
              aria-label={t('nav.signedInAs', { name: user?.displayName ?? '' })}
            >
              <Avatar
                name={user?.displayName ?? 'U'}
                size="sm"
                color={user?.avatarColor}
              />
            </Link>
          </div>
        </header>

        <main id="main-content" className={styles.main}>
          <RouteErrorBoundary compact>
            {children ?? <Outlet />}
          </RouteErrorBoundary>
        </main>
      </div>

      <nav className={styles.bottomNav} aria-label={t('nav.mobile')}>
        {mobileNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? styles.bottomActive : styles.bottomLink
            }
          >
            {item.icon}
            <span>{t(item.labelKey).split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>

      <ChatbotFab />
      <ToastHost />
    </div>
  )
}

export function UserAvatar({ name }: { name: string }) {
  return <Avatar name={name} size="sm" />
}
