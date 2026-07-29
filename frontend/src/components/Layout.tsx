import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../store/auth.store';

/**
 * App shell matching the Figma wireframes (file eMdAoJ0lMeFkwPk8TAZviQ):
 * every signed-in screen shares a 64px top bar (dark "Mdh" brand block,
 * page title, EN chip / notifications / logout on the right) and a 220px
 * left sidebar (gradient background, active item highlighted in
 * brand-steel, portal label pinned at the bottom).
 *
 * Signed-out pages (Sign In / Sign Up) render without any shell, exactly
 * like the auth frames in Figma.
 *
 * Disabled affordances (EN language switcher, Notifications, Profile) are
 * in the design but have no backend/routes yet — they render grayed-out
 * with a title explaining why, consistent with how LoginPage handles SSO.
 */

interface NavItem {
  label: string;
  to?: string; // no `to` = designed but not yet implemented
}

const STUDENT_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'My Tickets', to: '/tickets' },
  { label: 'AI Assistant', to: '/chat' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Notifications' },
  { label: 'Profile' },
];

const STAFF_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/staff' },
  { label: 'Queue', to: '/tickets' },
  { label: 'Create Ticket', to: '/tickets/new' },
  { label: 'Knowledge Base', to: '/faq' },
  { label: 'Analytics' },
  { label: 'Notifications' },
  { label: 'Profile' },
];

function pageTitle(pathname: string, isStaff: boolean): string {
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/staff')) return 'Dashboard';
  if (pathname.startsWith('/tickets/new')) return 'Create Ticket';
  if (pathname.startsWith('/tickets/')) return isStaff ? 'Ticket Resolution' : 'Ticket Detail';
  if (pathname.startsWith('/tickets')) return isStaff ? 'Ticket Queue' : 'My Tickets';
  if (pathname.startsWith('/chat')) return 'AI Assistant';
  if (pathname.startsWith('/faq')) return isStaff ? 'Knowledge Base' : 'FAQ';
  return 'TicketHub';
}

export function Layout() {
  const { user, clearSession } = useAuth();
  const { pathname } = useLocation();

  // Auth pages (and the public landing page) have no app shell in the design.
  if (!user) {
    return (
      <div className="min-h-screen bg-uts-bg">
        <Outlet />
      </div>
    );
  }

  const isStaff = user.role === 'STAFF' || user.role === 'ADMIN';
  const navItems = isStaff ? STAFF_NAV : STUDENT_NAV;
  const portalLabel = isStaff ? 'Staff Portal' : 'Student Portal';

  return (
    <div className="min-h-screen flex flex-col bg-uts-bg">
      <header className="h-16 flex items-stretch border-b border-[#dedede] bg-white">
        <div className="w-[220px] shrink-0 bg-[#4a4a4a] flex items-center gap-2 px-4">
          <span className="w-8 h-8 rounded-full bg-[#cccccc] flex items-center justify-center text-[13px] font-semibold text-uts-text">
            M
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[14px] font-semibold text-white">
              Mdh <span className="text-[10px] font-normal text-[#bfbfbf]">v</span>
            </span>
            <span className="text-[10px] text-[#bfbfbf]">{portalLabel}</span>
          </span>
        </div>
        <div className="flex-1 flex items-center justify-between px-6 border-l border-[#c7c7c7]">
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold text-[#141414]">
              {pageTitle(pathname, isStaff)}
            </span>
            <span className="text-[10px] text-[#6b6b6b]">{portalLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled
              title="Language switching isn't implemented yet"
              className="h-7 px-2.5 rounded-md border border-[#c7c7c7] bg-white text-[11px] font-medium text-[#6b6b6b] cursor-not-allowed"
            >
              EN <span className="text-[10px] text-[#a1a1a1]">v</span>
            </button>
            <button
              type="button"
              disabled
              title="Notifications aren't implemented yet"
              className="w-7 h-7 rounded-full bg-[#f2f2f2] text-[11px] font-medium text-[#6b6b6b] cursor-not-allowed"
            >
              N
            </button>
            <button
              type="button"
              onClick={clearSession}
              title={`Sign out (${user.displayName})`}
              className="w-7 h-7 rounded-full bg-[#f2f2f2] text-[11px] text-[#6b6b6b] hover:bg-uts-muted"
            >
              {'->'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <aside className="w-[220px] shrink-0 flex flex-col border-r border-[#e8e8e8] bg-gradient-to-b from-[#d7daf9] to-white to-65%">
          <nav className="flex flex-col gap-3 px-3 pt-7">
            {navItems.map((item) =>
              item.to ? (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === '/tickets'}
                  className={({ isActive }) =>
                    `rounded-md px-4 py-2 text-[14px] transition-colors ${
                      isActive
                        ? 'bg-brand-steel text-white font-medium shadow-sm'
                        : 'text-[#6b6b6b] hover:bg-white/80 hover:text-uts-text'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ) : (
                <span
                  key={item.label}
                  title="Designed in the wireframes but not implemented yet"
                  className="rounded-md px-4 py-2 text-[14px] text-[#b5b5b5] cursor-not-allowed"
                >
                  {item.label}
                </span>
              ),
            )}
          </nav>
          <p className="mt-auto px-6 pb-5 text-[11px] font-medium text-[#a1a1a1] uppercase tracking-wide">
            {portalLabel}
          </p>
        </aside>

        <main className="flex-1 min-w-0 p-8">
          <Outlet />
        </main>
      </div>

      {/* Floating AI chat bubble, present on every app screen in the design */}
      {pathname !== '/chat' && (
        <Link
          to="/chat"
          title="Ask the AI Assistant"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand-steel text-white text-[13px] font-semibold flex items-center justify-center shadow-lg hover:bg-brand-cornflower"
        >
          AI
        </Link>
      )}
    </div>
  );
}
