import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../store/auth.store';
import type { Ticket } from '../../tickets/types';

interface FaqEntry {
  id: string;
  question: string;
}

/**
 * Matches the Figma "01 - Student Dashboard" wireframe (file
 * eMdAoJ0lMeFkwPk8TAZviQ, node 1:2). See docs/Figma_To_Code_Guide.md for the
 * full walkthrough of how this screen was converted — the short version:
 *
 * - Routing decision: this is a dedicated `/dashboard` route rather than a
 *   role-aware `/`, because it's explicitly a *student* view (the wireframe
 *   footer literally says "STUDENT PORTAL"). Staff/Admin get redirected to
 *   `/tickets`, which is their existing landing page.
 * - "Awaiting Response" in the design has no backing status field — the
 *   backend only has OPEN / IN_PROGRESS / RESOLVED / CLOSED. Rather than
 *   invent a distinction the API can't back, the middle stat card is
 *   relabeled "In Progress" and counts that real status.
 * - "Suggested Articles" has no recommendation endpoint. It shows the first
 *   3 real entries from GET /kb/faq instead of a fake personalized ranking.
 * - Three designer annotations were on this frame in Figma:
 *   1. Recent Tickets should only include OPEN/IN_PROGRESS tickets — done
 *      below via a filter.
 *   2. Open vs In Progress need visually distinct status chips — done via
 *      statusChipStyle().
 *   3. Replying to a Resolved ticket should reopen it — already implemented
 *      server-side in services/tickets.py::add_comment, nothing to do here.
 */
export function DashboardPage() {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [articles, setArticles] = useState<FaqEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Ticket[]>('/tickets')
      .then(setTickets)
      .catch((err: Error) => setError(err.message));
    apiClient
      .get<FaqEntry[]>('/kb/faq')
      .then((entries) => setArticles(entries.slice(0, 3)))
      .catch(() => {
        // Suggested Articles is a nice-to-have panel — an FAQ fetch failure
        // shouldn't block the rest of the dashboard from rendering.
      });
  }, []);

  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'STUDENT') return <Navigate to="/tickets" replace />;

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedThisMonthCount = tickets.filter((t) => {
    if (t.status !== 'RESOLVED') return false;
    const updated = new Date(t.updatedAt);
    const now = new Date();
    return updated.getMonth() === now.getMonth() && updated.getFullYear() === now.getFullYear();
  }).length;

  const recentTickets = tickets
    .filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-uts-text">Dashboard</h1>
        <p className="text-[13px] text-uts-nav">Welcome back, {user.displayName.split(' ')[0]}.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Open Tickets" value={openCount} />
        <StatCard label="In Progress" value={inProgressCount} />
        <StatCard label="Resolved This Month" value={resolvedThisMonthCount} />
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-4 items-start">
        <div className="bg-white border border-uts-muted rounded-lg">
          <div className="px-4 py-3 border-b border-uts-muted">
            <h2 className="text-[16px] font-semibold text-uts-text">Recent Tickets</h2>
          </div>
          <div className="divide-y divide-[#ededed]">
            {recentTickets.map((t) => (
              <Link
                key={t.id}
                to={`/tickets/${t.id}`}
                className="flex flex-col gap-2 px-4 py-3 hover:bg-[#fafafa]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-[14px] font-medium text-uts-text">{t.subject}</span>
                  <span className="text-[11px] text-[#a1a1a1] whitespace-nowrap">
                    {relativeTime(t.createdAt)}
                  </span>
                </div>
                <div className="flex gap-2">
                  {t.department && <Chip tone="neutral">{t.department}</Chip>}
                  <Chip tone={statusTone(t.status)}>{statusLabel(t.status)}</Chip>
                </div>
              </Link>
            ))}
            {recentTickets.length === 0 && !error && (
              <p className="px-4 py-6 text-sm text-uts-nav">No open tickets right now.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-uts-muted rounded-lg">
            <div className="px-4 py-3 border-b border-uts-muted">
              <h2 className="text-[16px] font-semibold text-uts-text">Suggested Articles</h2>
            </div>
            <div className="divide-y divide-[#ededed]">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  to="/faq"
                  className="flex items-center justify-between gap-2 px-4 py-3 text-[13px] text-[#525252] hover:bg-[#fafafa]"
                >
                  {a.question}
                  <span className="text-[#a1a1a1]" aria-hidden="true">
                    &gt;
                  </span>
                </Link>
              ))}
              {articles.length === 0 && (
                <p className="px-4 py-3 text-[13px] text-uts-nav">No FAQ entries yet.</p>
              )}
            </div>
          </div>

          <div className="bg-brand-steel border border-uts-muted rounded-lg p-4">
            <p className="text-[14px] font-semibold text-white">Need a quick answer?</p>
            <p className="text-[12px] text-white mt-1 mb-4">
              Ask our AI Assistant, available 24/7.
            </p>
            <Link
              to="/chat"
              className="inline-block bg-white text-brand-sky text-[13px] font-medium rounded-md px-4 py-2"
            >
              Open Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-brand-steel border border-[#dedede] rounded-lg p-4">
      <p className="text-[12px] font-medium text-white">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function statusLabel(status: Ticket['status']): string {
  if (status === 'IN_PROGRESS') return 'In Progress';
  if (status === 'OPEN') return 'Open';
  if (status === 'RESOLVED') return 'Resolved';
  return 'Closed';
}

// Maps a ticket status to a chip color "tone" — kept separate from the
// display label above so a relabel doesn't accidentally change the color.
function statusTone(status: Ticket['status']): 'open' | 'progress' | 'resolved' | 'neutral' {
  if (status === 'OPEN') return 'open';
  if (status === 'IN_PROGRESS') return 'progress';
  if (status === 'RESOLVED') return 'resolved';
  return 'neutral';
}

function Chip({
  tone,
  children,
}: {
  tone: 'open' | 'progress' | 'resolved' | 'neutral';
  children: string;
}) {
  const textColor =
    tone === 'open'
      ? 'text-[#ad3e3e]'
      : tone === 'progress'
        ? 'text-[#e4b600]'
        : tone === 'resolved'
          ? 'text-[#3a6133]'
          : 'text-[#525252]';
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[#c7c7c7] bg-brand-cornflower/35 px-2.5 py-0.5 text-[11px] font-semibold ${textColor}`}
    >
      {children}
    </span>
  );
}

function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 0)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
