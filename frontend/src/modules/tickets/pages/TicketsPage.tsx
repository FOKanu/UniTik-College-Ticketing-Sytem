import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../store/auth.store';
import { priorityTextColor, relativeTime } from '../format';
import { StatusChip } from '../ui';
import type { Ticket, TicketStatus } from '../types';

const PAGE_SIZE = 8;

/**
 * Matches Figma "02 - Student My Tickets" (node 1:3); doubles as the staff
 * "Ticket Queue" (node 1:8) since both are the same table over GET /tickets —
 * the backend already scopes results by role (students: own tickets only).
 *
 * Filters + search + pagination are client-side over the fetched list. The
 * ticket creation form that used to live inline here moved to /tickets/new
 * (Figma has a dedicated Create Ticket screen).
 */
export function TicketsPage() {
  const { token, user } = useAuth();
  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN';
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    apiClient
      .get<Ticket[]>('/tickets')
      .then(setTickets)
      .catch((err: Error) => setError(err.message));
  }, []);

  // Department options come from the data itself, so the dropdown never
  // offers a department that has no tickets.
  const departments = useMemo(
    () => [...new Set(tickets.map((t) => t.department).filter((d): d is string => !!d))].sort(),
    [tickets],
  );

  const filtered = useMemo(() => {
    return tickets
      .filter((t) => statusFilter === 'ALL' || t.status === statusFilter)
      .filter((t) => departmentFilter === 'ALL' || t.department === departmentFilter)
      .filter((t) => t.subject.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [tickets, statusFilter, departmentFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-uts-text">
          {isStaff ? 'Ticket Queue' : 'My Tickets'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/tickets/new')}
          className="h-10 px-5 rounded-md bg-brand-steel text-white text-[13px] font-medium"
        >
          + New Ticket
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TicketStatus | 'ALL');
            setPage(0);
          }}
          className="h-9 rounded-md border border-[#c7c7c7] bg-white px-3 text-[12px] text-[#525252]"
        >
          <option value="ALL">Status: All</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={departmentFilter}
          onChange={(e) => {
            setDepartmentFilter(e.target.value);
            setPage(0);
          }}
          className="h-9 rounded-md border border-[#c7c7c7] bg-white px-3 text-[12px] text-[#525252]"
        >
          <option value="ALL">Department: All</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search tickets..."
          className="h-9 flex-1 max-w-[320px] ml-auto rounded-md border border-[#c7c7c7] bg-white px-4 text-[12px] placeholder:text-[#a1a1a1]"
        />
      </div>

      <div className="bg-white border border-[#dedede] rounded-lg shadow-sm px-5 pt-4 pb-2">
        <div className="grid grid-cols-[80px_1fr_140px_120px_100px_90px] gap-2 pb-2 border-b border-[#dedede] text-[11px] font-medium text-[#a1a1a1]">
          <span>ID</span>
          <span>Title</span>
          <span>Department</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Updated</span>
        </div>
        {pageRows.map((t) => (
          <Link
            key={t.id}
            to={`/tickets/${t.id}`}
            className="grid grid-cols-[80px_1fr_140px_120px_100px_90px] gap-2 items-center py-3.5 border-b border-[#ededed] hover:bg-[#fafafa]"
          >
            <span className="text-[12px] text-[#6b6b6b] font-mono" title={t.id}>
              {t.id.slice(0, 6)}
            </span>
            <span className="text-[13px] font-medium text-uts-text truncate">{t.subject}</span>
            <span className="text-[12px] text-[#6b6b6b]">{t.department ?? '—'}</span>
            <span>
              <StatusChip status={t.status} />
            </span>
            <span className={`text-[12px] capitalize ${priorityTextColor(t.priority)}`}>
              {t.priority.toLowerCase()}
            </span>
            <span className="text-[12px] text-[#a1a1a1]">{relativeTime(t.updatedAt)}</span>
          </Link>
        ))}
        {pageRows.length === 0 && !error && (
          <p className="py-6 text-sm text-uts-nav">No tickets match.</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[#a1a1a1]">
          Showing {filtered.length === 0 ? 0 : page * PAGE_SIZE + 1}-
          {Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="h-8 px-5 rounded-md bg-brand-steel text-white text-[13px] font-medium disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((p) => p + 1)}
            className="h-8 px-5 rounded-md bg-brand-steel text-white text-[13px] font-medium disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
