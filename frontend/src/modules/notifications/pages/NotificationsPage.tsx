import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { useAuth } from '../../../store/auth.store';
import { formatNotificationTime, mockNotifications } from '../mockData';
import { NotificationItem } from '../types';

/**
 * TODO(backend): this page currently reads/writes `mockNotifications` in
 * memory. Once GET /notifications, PATCH /notifications/:id and
 * PATCH /notifications/read-all exist on the backend, replace the three
 * handlers below with apiClient calls (see lib/api-client.ts for the
 * pattern used elsewhere, e.g. modules/faq/pages/FaqPage.tsx).
 */
export function NotificationsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Simulated fetch latency, mirrors the mock-data-source behavior in the
    // reference implementation.
    const timer = setTimeout(() => {
      setItems(mockNotifications);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Signing out while on this page (e.g. via the header's sign-out button)
  // clears the token but doesn't unmount this component on its own — without
  // this guard the page kept rendering its content outside the app shell.
  if (!token) return <Navigate to="/login" replace />;


  const markRead = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const allRead = items.every((item) => item.read);

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-uts-text">Notifications</h1>
          <p className="text-sm text-uts-nav mt-1">Updates about your tickets and conversations.</p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={loading || allRead}
          className="h-8 px-3 rounded-md border border-uts-muted bg-white text-[13px] font-medium text-uts-text hover:bg-uts-bg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mark all read
        </button>
      </div>

      {loading ? <p className="text-sm text-uts-nav">Loading notifications…</p> : null}

      {!loading && items.length === 0 ? (
        <p className="text-sm text-uts-nav">You have no notifications yet.</p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 ${
              item.read ? 'border-uts-muted bg-white' : 'border-brand-steel/40 bg-brand-steel/5'
            }`}
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-uts-text flex items-center gap-2">
                {item.title}
                {!item.read ? <span className="w-2 h-2 rounded-full bg-brand-steel" aria-label="unread" /> : null}
              </p>
              <p className="text-[13px] text-uts-nav mt-0.5">{item.body}</p>
              <time className="text-[11px] text-uts-nav/80 mt-1 block">
                {formatNotificationTime(item.createdAt)}
              </time>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {!item.read ? (
                <button
                  type="button"
                  onClick={() => markRead(item.id)}
                  className="text-[12px] font-medium text-brand-steel hover:underline"
                >
                  Mark read
                </button>
              ) : null}
              {item.ticketId ? (
                <Link to={`/tickets/${item.ticketId}`} className="text-[12px] font-medium text-brand-steel hover:underline">
                  View
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

