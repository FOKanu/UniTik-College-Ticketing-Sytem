import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../store/auth.store';
import { relativeTime } from '../format';
import { DepartmentChip, StatusChip } from '../ui';
import { TICKET_STATUS_OPTIONS, type Ticket, type TicketComment, type TicketStatus } from '../types';

/**
 * Matches Figma "04 - Student Ticket Detail" (node 1:5); for staff this same
 * page is the "08 - Ticket Resolution" view (node 1:9) — identical layout
 * plus the status select and the reassign panel.
 *
 * Layout: left column is ticket meta (status timeline, department, priority,
 * created date, assignee); right column is the conversation thread with the
 * current user's messages right-aligned in steel, everyone else's
 * left-aligned in tinted cornflower, and internal notes dashed (staff only —
 * the backend never sends internal comments to students).
 *
 * Omitted from the design on purpose: the Attachments card — the ticket API
 * response doesn't include attachments and there's no endpoint to fetch or
 * upload them yet (backlog item in docs/Code_Refactor.md).
 */
export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN';

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [replyBody, setReplyBody] = useState('');
  const [replyIsInternal, setReplyIsInternal] = useState(false);

  const [department, setDepartment] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [status, setStatus] = useState<TicketStatus | ''>('');

  const load = () => {
    if (!id) return;
    apiClient
      .get<Ticket>(`/tickets/${id}`)
      .then((t) => {
        setTicket(t);
        setDepartment(t.department ?? '');
        setAssignedToId(t.assignedToId ?? '');
        setStatus(t.status);
      })
      .catch((err: Error) => setError(err.message));
    apiClient
      .get<TicketComment[]>(`/tickets/${id}/comments`)
      .then(setComments)
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!token) return <Navigate to="/login" replace />;

  const handleReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await apiClient.post(`/tickets/${id}/comments`, {
        body: replyBody,
        isInternal: isStaff ? replyIsInternal : false,
      });
      setReplyBody('');
      setReplyIsInternal(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reply');
    }
  };

  // Reassign without touching status — the "keep open" action from
  // docs/architecture/README.md §8: redirecting ownership is not resolving.
  const handleReassign = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await apiClient.patch(`/tickets/${id}`, {
        department: department || null,
        assignedToId: assignedToId || null,
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reassign ticket');
    }
  };

  const handleStatusChange = async (nextStatus: TicketStatus) => {
    if (!id) return;
    try {
      await apiClient.patch(`/tickets/${id}`, { status: nextStatus });
      setStatus(nextStatus);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  if (error && !ticket) {
    return <p className="text-red-600 text-sm">{error}</p>;
  }
  if (!ticket) {
    return <p className="text-sm text-uts-nav">Loading ticket…</p>;
  }

  const timelineReached: Record<'submitted' | 'progress' | 'resolved', boolean> = {
    submitted: true,
    progress: ticket.status !== 'OPEN',
    resolved: ticket.status === 'RESOLVED' || ticket.status === 'CLOSED',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/tickets" className="text-[16px] text-[#a1a1a1] hover:text-uts-text">
          &lt;
        </Link>
        <span className="text-[11px] font-medium text-[#a1a1a1] font-mono" title={ticket.id}>
          {ticket.id.slice(0, 8)}
        </span>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-uts-text">{ticket.subject}</h1>
        <div className="flex gap-2 mt-2 items-center">
          {ticket.department && <DepartmentChip>{ticket.department}</DepartmentChip>}
          <StatusChip status={ticket.status} />
          <DepartmentChip>{`${ticket.priority.charAt(0)}${ticket.priority.slice(1).toLowerCase()} Priority`}</DepartmentChip>
          {isStaff && (
            <select
              value={status}
              onChange={(e) => void handleStatusChange(e.target.value as TicketStatus)}
              className="ml-auto h-8 rounded-md border border-[#c7c7c7] bg-white px-2 text-[12px] text-[#525252]"
            >
              {TICKET_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-[300px_1fr] gap-8 items-start">
        <aside className="space-y-5">
          <div>
            <p className="text-[11px] font-medium text-[#a1a1a1] mb-3">Status</p>
            <div className="space-y-0">
              <TimelineStep label="Submitted" reached={timelineReached.submitted} last={false} />
              <TimelineStep label="In Progress" reached={timelineReached.progress} last={false} />
              <TimelineStep label="Resolved" reached={timelineReached.resolved} last />
            </div>
          </div>

          <MetaRow label="Department" value={ticket.department ?? '—'} />
          <MetaRow
            label="Priority"
            value={ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase()}
          />
          <MetaRow
            label="Created"
            value={new Date(ticket.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          />
          <MetaRow
            label="Assigned to"
            value={ticket.assignedToId ? ticket.assignedToId.slice(0, 8) : 'Unassigned'}
          />

          <div className="bg-white border border-[#dedede] rounded-md p-3">
            <p className="text-[11px] font-medium text-[#a1a1a1] mb-1">Description</p>
            <p className="text-[12px] text-[#525252]">{ticket.description}</p>
          </div>

          {isStaff && (
            <form
              onSubmit={(e) => void handleReassign(e)}
              className="bg-white border border-uts-muted rounded-lg shadow-sm p-4 space-y-3"
            >
              <h2 className="text-[13px] font-semibold text-uts-text">Reassign Ticket</h2>
              <label className="block space-y-1">
                <span className="text-[11px] text-[#a1a1a1]">Department</span>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. IT"
                  className="w-full h-9 rounded-md border border-[#c7c7c7] px-3 text-[12px]"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-[#a1a1a1]">Agent user ID</span>
                <input
                  value={assignedToId}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  placeholder="optional"
                  className="w-full h-9 rounded-md border border-[#c7c7c7] px-3 text-[12px]"
                />
              </label>
              <button
                type="submit"
                className="w-full h-9 rounded-md border border-[#c7c7c7] bg-white text-[12px] font-medium text-[#2e2e2e] hover:border-brand-sky"
              >
                Reassign and Keep Open
              </button>
            </form>
          )}
        </aside>

        <div className="space-y-4">
          <div className="bg-white border border-[#dedede] rounded-lg shadow-sm p-5 min-h-[320px] space-y-4">
            {comments.map((c) => {
              const mine = c.authorId === user?.id;
              return (
                <div key={c.id} className={mine ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
                  <div
                    className={`max-w-[62%] rounded-[10px] px-4 py-3 text-[12px] ${
                      c.isInternal
                        ? 'border border-dashed border-uts-nav bg-brand-cornflower/20 text-[#2e2e2e]'
                        : mine
                          ? 'bg-brand-steel text-white'
                          : 'bg-brand-cornflower/35 text-[#2e2e2e]'
                    }`}
                  >
                    {c.isInternal && (
                      <p className="text-[10px] text-[#6b6b6b] mb-1">
                        Internal Note - visible to staff only
                      </p>
                    )}
                    {c.body}
                  </div>
                  <p className="text-[10px] text-[#a1a1a1] mt-1">
                    {mine ? 'You' : c.authorId.slice(0, 8)} · {relativeTime(c.createdAt)}
                  </p>
                </div>
              );
            })}
            {comments.length === 0 && <p className="text-sm text-uts-nav">No replies yet.</p>}
          </div>

          <form
            onSubmit={(e) => void handleReply(e)}
            className="bg-white border border-[#c7c7c7] rounded-lg p-3 flex items-end gap-3"
          >
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              required
              className="flex-1 resize-none text-[12px] placeholder:text-[#a1a1a1] outline-none"
            />
            <div className="flex items-center gap-3">
              {isStaff && (
                <label className="flex items-center gap-1.5 text-[11px] text-[#6b6b6b] whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={replyIsInternal}
                    onChange={(e) => setReplyIsInternal(e.target.checked)}
                  />
                  Internal note
                </label>
              )}
              <button
                type="submit"
                className="h-10 px-6 rounded-md bg-brand-steel text-white text-[13px] font-medium"
              >
                Send
              </button>
            </div>
          </form>

          {!isStaff && (
            <p className="text-[11px] text-[#a1a1a1]">
              Note: replying to a resolved ticket automatically reopens it for staff review.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineStep({ label, reached, last }: { label: string; reached: boolean; last: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={`w-3 h-3 rounded-full ${reached ? 'bg-brand-steel' : 'border border-[#c7c7c7] bg-white'}`}
        />
        {!last && <span className="w-0.5 h-9 bg-[#dedede]" />}
      </div>
      <span
        className={`text-[13px] -mt-0.5 ${reached ? 'font-medium text-uts-text' : 'text-[#a1a1a1]'}`}
      >
        {label}
      </span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[#a1a1a1]">{label}</p>
      <p className="text-[13px] text-uts-text mt-0.5">{value}</p>
    </div>
  );
}
