import { NotificationsList } from '../components/NotificationsList';

// Ticket status-change notifications list.
// Requirement(s) covered: NFR-1.2.2
export function NotificationsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
      <NotificationsList />
    </div>
  );
}
