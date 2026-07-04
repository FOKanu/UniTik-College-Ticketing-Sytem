import { NavLink, Outlet } from 'react-router-dom';

// TODO: replace static nav with role-aware nav once auth returns real roles
// (e.g. hide /admin for STUDENT).
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tickets', label: 'Tickets' },
  { to: '/chatbot', label: 'Chatbot' },
  { to: '/faq', label: 'FAQ' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/admin', label: 'Admin' },
  { to: '/profile', label: 'Profile' },
];

export function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <nav className="max-w-6xl mx-auto flex gap-4 px-4 py-3 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium whitespace-nowrap ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
