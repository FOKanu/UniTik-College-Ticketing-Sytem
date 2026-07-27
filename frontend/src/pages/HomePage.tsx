import { useEffect, useState } from 'react';

import { getHealth } from '../lib/api-client';

export function HomePage() {
  const [health, setHealth] = useState<{ status: string; database: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-uts-text">TicketHub</h1>
      <p className="text-uts-nav">
        FastAPI foundation is running. Feature slices: auth, tickets, chat, and FAQ are available
        from the navigation once signed in.
      </p>
      <div className="rounded-lg border border-uts-muted p-4 bg-white">
        <h2 className="font-medium mb-2">API health</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {health && (
          <ul className="text-sm space-y-1">
            <li>
              Status: <span className="font-mono">{health.status}</span>
            </li>
            <li>
              Database: <span className="font-mono">{health.database}</span>
            </li>
          </ul>
        )}
        {!health && !error && <p className="text-sm text-uts-nav">Checking API…</p>}
      </div>
    </div>
  );
}
