import { AdminList } from '../components/AdminList';

// Admin-only view: audit log review and management actions.
// Requirement(s) covered: NFR-2.6 (audit log), NFR-1.4 (RBAC)
export function AdminPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-gray-900">Admin</h1>
      <AdminList />
    </div>
  );
}
