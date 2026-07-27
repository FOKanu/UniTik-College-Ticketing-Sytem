import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../store/auth.store';
import { TICKET_STATUS_OPTIONS, type Ticket, type TicketComment, type TicketStatus } from '../types';

/**
 * Ticket detail / resolution view.
 *
 * Students: see their own ticket plus the (non-internal) comment thread, and
 * can reply. Replying to a Resolved ticket re-opens it — that's enforced on
 * the backend (services/tickets.py::add_comment), this page just reflects
 * whatever status comes back after the reload.
 *
 * Staff/Admin: additionally get a "reassign" form (department + assignee)
 * and an explicit Resolve action, matching the two ticket-lifecycle rules in
 * docs/architecture/README.md §8 — reassigning is a separate action from
 * resolving, so it never forces a status change on its own.
 *
 * Note: there's no staff-directory endpoint yet, so "assignee" is a plain
 * user-id text field rather than a dropdown of matching staff. Flag to the
 * team if/when a GET /users?department= endpoint gets built.
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

  // Reassign/save without touching status — this is the "keep open" action:
  // moving a ticket to the right department/person is not the same as
  // resolving it.
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

  return (
    <div className="space-y-6">
      <Link to="/tickets" className="text-sm text-brand-sky hover:underline">
        ← Back to tickets
      </Link>

      <div className="bg-white border border-uts-muted rounded-lg p-4 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold">{ticket.subject}</h1>
          {isStaff ? (
            <select
              value={status}
              onChange={(e) => void handleStatusChange(e.target.value as TicketStatus)}
              className="border border-uts-muted rounded px-2 py-1 text-sm"
            >
              {TICKET_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm font-mono">{ticket.status}</span>
          )}
        </div>
        <p className="text-sm text-uts-nav">
          {ticket.priority}
          {ticket.category ? ` · ${ticket.category}` : ''}
          {ticket.department ? ` · ${ticket.department}` : ''}
        </p>
        <p className="text-sm">{ticket.description}</p>
      </div>

      {isStaff && (
        <form
          onSubmit={(e) => void handleReassign(e)}
          className="bg-white border border-uts-muted rounded-lg p-4 space-y-3"
        >
          <h2 className="font-medium">Reassign ticket</h2>
          <div className="flex gap-3">
            <label className="flex-1 flex flex-col gap-1 text-sm">
              Department
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. IT"
                className="border border-uts-muted rounded px-3 py-2"
              />
            </label>
            <label className="flex-1 flex flex-col gap-1 text-sm">
              Agent user ID
              <input
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                placeholder="optional"
                className="border border-uts-muted rounded px-3 py-2"
              />
            </label>
          </div>
          <button
            type="submit"
            className="bg-uts-nav text-white px-4 py-2 rounded text-sm"
          >
            Reassign &amp; keep open
          </button>
        </form>
      )}

      <div className="space-y-3">
        <h2 className="font-medium">Conversation</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {comments.map((c) => (
          <div
            key={c.id}
            className={`border rounded p-3 bg-white ${
              c.isInternal ? 'border-dashed border-uts-nav' : 'border-uts-muted'
            }`}
          >
            {c.isInternal && (
              <p className="text-xs text-uts-nav mb-1">Internal note — staff only</p>
            )}
            <p className="text-sm">{c.body}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-uts-nav">No replies yet.</p>
        )}
      </div>

      <form
        onSubmit={(e) => void handleReply(e)}
        className="bg-white border border-uts-muted rounded-lg p-4 space-y-3"
      >
        <textarea
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          placeholder="Write a reply…"
          rows={3}
          required
          className="w-full border border-uts-muted rounded px-3 py-2"
        />
        <div className="flex items-center justify-between">
          {isStaff && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={replyIsInternal}
                onChange={(e) => setReplyIsInternal(e.target.checked)}
              />
              Internal note (hidden from student)
            </label>
          )}
          <button type="submit" className="bg-brand-steel text-white px-4 py-2 rounded ml-auto">
            Send reply
          </button>
        </div>
        {!isStaff && ticket.status === 'RESOLVED' && (
          <p className="text-xs text-uts-nav">
            Replying will reopen this ticket for staff review.
          </p>
        )}
      </form>
    </div>
  );
}
