import { FormEvent, useEffect, useState } from 'react';

import { apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../store/auth.store';

interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

export function FaqPage() {
  const { user } = useAuth();
  // Only STAFF/ADMIN may create FAQ entries — the backend enforces this too
  // (POST /kb/faq is behind require_roles(STAFF, ADMIN)), this just avoids
  // showing a form that would 403 for students.
  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN';

  const [entries, setEntries] = useState<FaqEntry[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FaqEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const loadEntries = () => {
    apiClient
      .get<FaqEntry[]>('/kb/faq')
      .then(setEntries)
      .catch((err: Error) => setError(err.message));
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const search = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = await apiClient.post<Array<FaqEntry & { score?: number }>>('/kb/search', {
        query,
        limit: 5,
      });
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    }
  };

  const createEntry = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await apiClient.post('/kb/faq', {
        question,
        answer,
        category: category || null,
      });
      setQuestion('');
      setAnswer('');
      setCategory('');
      loadEntries();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create FAQ entry');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-uts-text">
          {isStaff ? 'Knowledge Base' : 'FAQ'}
        </h1>
        <p className="text-[13px] text-[#6b6b6b] mt-1">
          {isStaff
            ? 'Manage the articles the AI Assistant and students rely on.'
            : 'Search common questions before opening a ticket.'}
        </p>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <form onSubmit={(e) => void search(e)} className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          className="flex-1 max-w-[420px] h-10 rounded-md border border-[#c7c7c7] bg-white px-4 text-[12px] placeholder:text-[#a1a1a1]"
        />
        <button
          type="submit"
          className="h-10 px-6 rounded-md bg-brand-steel text-white text-[13px] font-medium"
        >
          Search
        </button>
      </form>

      {isStaff && (
        <form
          onSubmit={(e) => void createEntry(e)}
          className="space-y-3 border border-uts-muted p-4 rounded-lg bg-white shadow-sm"
        >
          <h2 className="font-medium">Add FAQ entry</h2>
          <input
            placeholder="Question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full border border-uts-muted rounded px-3 py-2"
            required
          />
          <textarea
            placeholder="Answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            className="w-full border border-uts-muted rounded px-3 py-2"
            required
          />
          <input
            placeholder="Category (optional)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-uts-muted rounded px-3 py-2"
          />
          {createError && <p className="text-red-600 text-sm">{createError}</p>}
          <button type="submit" className="bg-brand-steel text-white px-4 py-2 rounded">
            Add entry
          </button>
        </form>
      )}

      <section>
        <h2 className="font-medium mb-2">All entries</h2>
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="border border-uts-muted rounded-lg p-4 bg-white shadow-sm">
              <div className="font-medium">{e.question}</div>
              <p className="text-sm text-uts-nav mt-1">{e.answer}</p>
            </li>
          ))}
        </ul>
      </section>
      {results.length > 0 && (
        <section>
          <h2 className="font-medium mb-2">Search results</h2>
          <ul className="space-y-2">
            {results.map((e) => (
              <li key={e.id} className="border border-brand-cornflower rounded p-3 bg-white">
                <div className="font-medium">{e.question}</div>
                <p className="text-sm text-uts-nav mt-1">{e.answer}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
