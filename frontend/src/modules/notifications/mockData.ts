import { NotificationItem } from './types';

/**
 * TODO(backend): replace this mock list with a real call once
 * GET /notifications (and PATCH /notifications/:id, /notifications/read-all)
 * exist on the backend. The `Notification` table already exists in
 * app/models/__init__.py — only the API routes are missing.
 *
 * When that's ready, swap `mockNotifications` usage in
 * `pages/NotificationsPage.tsx` for `apiClient.get<NotificationItem[]>('/notifications')`
 * etc. — the component/store shape below is already written to match.
 */
export const mockNotifications: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Ticket updated',
    body: 'Staff replied to "Cannot access course portal".',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    ticketId: '07fe31f0-ef59-4c60-b277-8b41c73cb39a', // owned by jordan.alvarez
  },
  {
    id: 'n-2',
    title: 'Ticket status changed',
    body: '"Intermittent VPN disconnects" moved to In Progress.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    ticketId: 'f1fa82da-72e1-41ac-a003-a3c1a0e0bc33', // owned by jordan.alvarez
  },
  {
    id: 'n-3',
    title: 'Ticket resolved',
    body: 'Your ticket was marked as resolved. Let us know if the issue reoccurs.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    ticketId: '07fe31f0-ef59-4c60-b277-8b41c73cb39a', // owned by jordan.alvarez
  },
  {
    id: 'n-4',
    title: 'Welcome to TicketHub',
    body: 'You can track all updates about your tickets here.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

export function formatNotificationTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

