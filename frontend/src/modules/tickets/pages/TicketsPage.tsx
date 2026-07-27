import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../store/auth.store';
import type { Ticket } from '../types';

export function TicketsPage() {
  const { token, user } = useAuth();
  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN';
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiClient
      .get<Ticket[]>('/tickets')
      .then(setTickets)
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    load();
  }, []);

  if (!token) return <Navigate to="/login" replace />;

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/tickets', { subject, description });
      setSubject('');
      setDescription('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{isStaff ? 'All tickets' : 'My tickets'}</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <form onSubmit={(e) => void handleCreate(e)} className="space-y-3 border border-uts-muted p-4 rounded-lg bg-white">
        <h2 className="font-medium">Create ticket</h2>
        <input
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border border-uts-muted rounded px-3 py-2"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-uts-muted rounded px-3 py-2"
          rows={3}
          required
        />
        <button type="submit" className="bg-brand-steel text-white px-4 py-2 rounded">
          Submit
        </button>
      </form>
      <ul className="space-y-2">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link
              to={`/tickets/${t.id}`}
              className="block border border-uts-muted rounded p-3 bg-white hover:border-brand-sky"
            >
              <div className="font-medium">{t.subject}</div>
              <div className="text-sm text-uts-nav">
                {t.status} · {t.priority}
                {t.department ? ` · ${t.department}` : ''}
              </div>
            </Link>
          </li>
        ))}
        {tickets.length === 0 && (
          <p className="text-sm text-uts-nav">No tickets yet.</p>
        )}
      </ul>
    </div>
  );
}
