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
      <h1 className="text-xl font-semibold">FAQ knowledge base</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <form onSubmit={(e) => void search(e)} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search FAQ…"
          className="flex-1 border border-uts-muted rounded px-3 py-2"
        />
        <button type="submit" className="bg-brand-steel text-white px-4 py-2 rounded">
          Search
        </button>
      </form>

      {isStaff && (
        <form
          onSubmit={(e) => void createEntry(e)}
          className="space-y-3 border border-uts-muted p-4 rounded-lg bg-white"
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
            <li key={e.id} className="border border-uts-muted rounded p-3 bg-white">
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
