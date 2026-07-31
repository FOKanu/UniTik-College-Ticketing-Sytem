import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../store/auth.store';
import type { TicketPriority } from '../types';

const CATEGORIES = ['Academics', 'IT', 'Finance', 'Maintenance'];
const PRIORITIES: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH'];

/**
 * Matches Figma "03 - Student Create Ticket" (node 1:4); staff use the same
 * form ("09 - Staff Create Ticket" is the same layout).
 *
 * The selected category pill is sent as BOTH `category` and `department` —
 * the page's own subtitle promises "we'll route it to the right department",
 * and the backend's create_ticket uses the department field for routing
 * (falls back to the user's own department when omitted).
 *
 * The attachments dropzone from the design is rendered disabled: the
 * Attachment model exists in the DB but there's no upload endpoint yet
 * (see "Attachment upload storage" in docs/Code_Refactor.md backlog).
 */
export function CreateTicketPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!token) return <Navigate to="/login" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/tickets', {
        subject,
        description,
        priority,
        category,
        department: category,
      });
      navigate('/tickets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const pillClass = (selected: boolean) =>
    `h-9 rounded-full px-6 text-[12px] font-medium ${
      selected ? 'bg-brand-steel text-white' : 'bg-white border border-[#c7c7c7] text-[#525252]'
    }`;

  return (
    <div className="grid grid-cols-[1fr_415px] gap-8 items-start">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 max-w-[717px]">
        <div>
          <h1 className="text-[22px] font-semibold text-uts-text">Create a New Ticket</h1>
          <p className="text-[13px] text-[#6b6b6b] mt-1">
            Tell us what&apos;s going on and we&apos;ll route it to the right department.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium text-[#a1a1a1]">Category</p>
          <div className="flex gap-3 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={pillClass(category === c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-[11px] font-medium text-[#a1a1a1]">Subject</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of the issue"
            required
            className="w-full h-10 rounded-md border border-[#c7c7c7] bg-white px-3.5 text-[12px] placeholder:text-[#a1a1a1]"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] font-medium text-[#a1a1a1]">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            required
            rows={6}
            className="w-full rounded-md border border-[#c7c7c7] bg-white px-3.5 py-3 text-[12px] placeholder:text-[#a1a1a1]"
          />
        </label>

        <div className="space-y-2">
          <p className="text-[11px] font-medium text-[#a1a1a1]">Priority</p>
          <div className="flex gap-3">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={pillClass(priority === p)}
              >
                {p === 'LOW' ? 'Low' : p === 'MEDIUM' ? 'Medium' : 'High'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium text-[#a1a1a1]">Attachments</p>
          <div
            title="File uploads aren't implemented yet (no upload endpoint on the backend)"
            className="rounded-md border border-dashed border-[#c7c7c7] bg-white px-4 py-8 text-[12px] text-[#a1a1a1] opacity-60 cursor-not-allowed"
          >
            Drag &amp; drop files, or click to browse (coming soon)
          </div>
        </div>

        {error && <p className="text-[12px] text-red-600">{error}</p>}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="h-11 px-8 rounded-md bg-brand-steel text-white text-[13px] font-medium disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Ticket'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="h-11 px-8 rounded-md border border-[#c7c7c7] bg-white text-[13px] font-medium text-[#2e2e2e]"
          >
            Cancel
          </button>
        </div>
      </form>

      <aside className="bg-brand-steel border border-[#dedede] rounded-lg shadow-sm p-5">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[12px] font-semibold text-brand-steel">
            AI
          </span>
          <p className="text-[14px] font-semibold text-white">Try our AI Assistant first</p>
        </div>
        <p className="text-[12px] text-white mt-3">
          Many issues can be resolved instantly, before you submit a ticket.
        </p>
        <ul className="text-[12px] text-white mt-3 space-y-1.5">
          <li>- Password &amp; account resets</li>
          <li>- Tuition &amp; refund timelines</li>
        </ul>
        <Link
          to="/chat"
          className="mt-4 block h-10 rounded-md bg-white text-brand-steel text-[13px] font-medium text-center leading-10"
        >
          Ask AI Assistant
        </Link>
      </aside>
    </div>
  );
}
