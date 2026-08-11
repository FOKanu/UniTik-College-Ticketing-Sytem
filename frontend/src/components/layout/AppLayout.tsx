import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { RouteTitle } from '@/app/RouteTitle'
import { ROUTES } from '@/app/routes'
import { ChatbotFab } from '@/components/layout/ChatbotFab'
import { LanguageSelector } from '@/components/layout/LanguageSelector'
import { ThemeSelector } from '@/components/layout/ThemeSelector'
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
import { useT, type MessageKey } from '@/lib/i18n'
import styles from './AppLayout.module.css'

interface NavItem {
  to: string
  labelKey: MessageKey
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

function portalLabelKey(
  role: UserRole | null | undefined,
): 'chrome.portal.admin' | 'chrome.portal.staff' | 'chrome.portal.student' {
  if (role === 'admin') return 'chrome.portal.admin'
  if (role === 'agent') return 'chrome.portal.staff'
  return 'chrome.portal.student'
}

function pageTitle(pathname: string): string {
  if (pathname.startsWith('/tickets/') && pathname !== ROUTES.ticketNew) {
    return 'Ticket Detail'
  }
  if (pathname.startsWith('/agent/tickets/') && pathname !== ROUTES.agentTicketNew) {
    return 'Ticket Resolution'
  }
  if (pathname.startsWith('/admin/settings/people')) return 'People'
  if (pathname.startsWith('/admin/settings')) return 'Settings'
  const map: Record<string, string> = {
    [ROUTES.dashboard]: 'Dashboard',
    [ROUTES.tickets]: 'My Tickets',
    [ROUTES.ticketNew]: 'Create Ticket',
    [ROUTES.assistant]: 'AI Assistant',
    [ROUTES.faq]: 'FAQ & Resources',
    [ROUTES.notifications]: 'Notifications',
    [ROUTES.profile]: 'Profile',
    [ROUTES.agent]: 'Dashboard',
    [ROUTES.queue]: 'Ticket Queue',
    [ROUTES.agentTicketNew]: 'Create Ticket',
    [ROUTES.knowledge]: 'Knowledge Base',
    [ROUTES.analytics]: 'Analytics',
    [ROUTES.admin]: 'Dashboard',
    [ROUTES.departments]: 'Departments',
    [ROUTES.settings]: 'Settings',
    [ROUTES.settingsPeople]: 'People',
    [ROUTES.settingsDepartments]: 'Settings',
    [ROUTES.settingsKnowledge]: 'Settings',
  }
  return map[pathname] ?? 'TicketHub'
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const t = useT()
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
  const title = pageTitle(location.pathname)
  const mobileNav =
    user?.role === 'student'
      ? studentNav.slice(0, 4)
      : navItems.slice(0, 4)

  function renderNav(compact: boolean) {
    return navItems.map((item) => {
      const label = t(item.labelKey)
      return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        title={compact ? label : undefined}
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
            <span className={styles.navLabel}>{label}</span>
            {item.soon ? <span className={styles.soon}>{t('chrome.soon')}</span> : null}
          </>
        ) : null}
      </NavLink>
      )
    })
  }

  return (
    <div
      className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ''}`}
    >
      <RouteTitle />
      <a href="#main-content" className={styles.skipLink}>
        {t('chrome.skipMain')}
      </a>

      {drawerOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label={t('chrome.closeMenu')}
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <aside
        className={`${styles.sidebar} ${drawerOpen ? styles.sidebarOpen : ''}`}
        aria-label="Primary"
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
            aria-label={t('chrome.closeMenu')}
            onClick={() => setDrawerOpen(false)}
          >
            <IconClose width={18} height={18} />
          </button>
        </div>

        <nav className={styles.sideNav}>{renderNav(collapsed)}</nav>

        <div className={styles.sideFooter}>
          {!collapsed ? (
            <div className={styles.langInDrawer}>
              <ThemeSelector />
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
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
              aria-label="Open menu"
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
              <ThemeSelector />
              <LanguageSelector />
            </div>
            <NotificationCenter />
            <Link
              to={ROUTES.profile}
              className={styles.avatarBtn}
              title={t('chrome.openProfile')}
              aria-label={t('chrome.signedInAs', {
                name: user?.displayName ?? 'U',
              })}
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

      <nav className={styles.bottomNav} aria-label="Mobile">
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
