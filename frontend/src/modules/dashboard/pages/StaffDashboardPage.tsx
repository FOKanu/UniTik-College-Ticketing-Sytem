import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../store/auth.store';
import { priorityTextColor, relativeTime } from '../../tickets/format';
import { StatusChip } from '../../tickets/ui';
import type { Ticket } from '../../tickets/types';

/**
 * Matches Figma "06 - Staff Agent Dashboard" (node 1:7). All numbers are
 * derived client-side from GET /tickets (staff receive every ticket).
 *
 * One deliberate deviation from the design: the "SLA Breaches" stat card is
 * replaced with "Unassigned" — there is no SLA engine on the backend yet
 * (backlog item), so an SLA number would have to be invented. Unassigned
 * count is real, and it's the queue-health signal staff can act on today.
 *
 * "Tickets by Department" is a simple CSS bar chart over real per-department
 * counts — no charting library needed at this scale.
 */
export function StaffDashboardPage() {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Ticket[]>('/tickets')
      .then(setTickets)
      .catch((err: Error) => setError(err.message));
  }, []);

  const departmentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of tickets) {
      const key = t.department ?? 'Unrouted';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [tickets]);

  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === 'STUDENT') return <Navigate to="/dashboard" replace />;

  const active = (t: Ticket) => t.status === 'OPEN' || t.status === 'IN_PROGRESS';
  const assignedToMe = tickets.filter((t) => t.assignedToId === user?.id && active(t));
  const unassigned = tickets.filter((t) => !t.assignedToId && active(t));
  const resolvedToday = tickets.filter((t) => {
    if (t.status !== 'RESOLVED') return false;
    const updated = new Date(t.updatedAt);
    const now = new Date();
    return updated.toDateString() === now.toDateString();
  });
  const queueVolume = tickets.filter(active);

  const maxDeptCount = Math.max(1, ...departmentCounts.map(([, n]) => n));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-uts-text">Agent Dashboard</h1>
        <p className="text-[13px] text-[#6b6b6b] mt-1">
          Welcome back, {user?.displayName}
          {user?.department ? ` (${user.department})` : ''}.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Assigned to Me" value={assignedToMe.length} />
        <StatCard label="Unassigned" value={unassigned.length} />
        <StatCard label="Resolved Today" value={resolvedToday.length} />
        <StatCard label="Queue Volume" value={queueVolume.length} />
      </div>

      <div className="grid grid-cols-[1fr_438px] gap-6 items-start">
        <div>
          <h2 className="text-[16px] font-semibold text-uts-text mb-3">My Queue</h2>
          <div className="bg-white border border-[#dedede] rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-[1fr_100px_100px_115px] gap-2 pb-2 border-b border-[#dedede] text-[11px] font-medium text-[#a1a1a1]">
              <span>Title</span>
              <span>Priority</span>
              <span>Opened</span>
              <span>Status</span>
            </div>
            {assignedToMe.map((t) => (
              <Link
                key={t.id}
                to={`/tickets/${t.id}`}
                className="grid grid-cols-[1fr_100px_100px_115px] gap-2 items-center py-3 border-b border-[#ededed] hover:bg-[#fafafa]"
              >
                <span className="text-[12px] font-medium text-uts-text truncate">{t.subject}</span>
                <span className={`text-[12px] capitalize ${priorityTextColor(t.priority)}`}>
                  {t.priority.toLowerCase()}
                </span>
                <span className="text-[12px] text-[#6b6b6b]">{relativeTime(t.createdAt)}</span>
                <span>
                  <StatusChip status={t.status} />
                </span>
              </Link>
            ))}
            {assignedToMe.length === 0 && (
              <p className="py-5 text-sm text-uts-nav">
                Nothing assigned to you right now.{' '}
                <Link to="/tickets" className="text-brand-sky hover:underline">
                  View the full queue
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-[16px] font-semibold text-uts-text mb-3">Tickets by Department</h2>
          <div className="bg-white border border-[#dedede] rounded-lg shadow-sm p-5 space-y-4">
            {departmentCounts.map(([dept, count]) => (
              <div key={dept}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-[#6b6b6b]">{dept}</span>
                  <span className="font-medium text-uts-text">{count}</span>
                </div>
                <div className="h-4 rounded bg-[#ededed]">
                  <div
                    className="h-4 rounded bg-brand-steel"
                    style={{ width: `${Math.round((count / maxDeptCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {departmentCounts.length === 0 && !error && (
              <p className="text-sm text-uts-nav">No tickets yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-brand-steel border border-[#dedede] rounded-lg shadow-sm p-4">
      <p className="text-[12px] font-medium text-white">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
