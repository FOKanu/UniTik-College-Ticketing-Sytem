import { DashboardList } from '../components/DashboardList';

// Live per-department ticket counts (open/in-progress/resolved).
// Requirement(s) covered: NFR-1.6 (live dashboards)
export function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      <DashboardList />
    </div>
  );
}
