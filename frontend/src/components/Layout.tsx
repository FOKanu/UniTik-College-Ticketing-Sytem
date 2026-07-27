import { Link, Outlet } from 'react-router-dom';

import { useAuth } from '../store/auth.store';

export function Layout() {
  const { user, clearSession } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-uts-nav text-white px-6 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold text-lg">
          University Ticketing
        </Link>
        <nav className="flex gap-4 text-sm items-center">
          {user ? (
            <>
              <Link to="/tickets" className="hover:text-brand-sky">
                Tickets
              </Link>
              <Link to="/chat" className="hover:text-brand-sky">
                Chat
              </Link>
              <Link to="/faq" className="hover:text-brand-sky">
                FAQ
              </Link>
              <span className="opacity-90">{user.displayName}</span>
              <button
                type="button"
                onClick={clearSession}
                className="text-brand-sky hover:underline"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="text-brand-sky hover:underline">
              Sign in
            </Link>
          )}
        </nav>
      </header>
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
