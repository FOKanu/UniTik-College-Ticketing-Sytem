import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../../../lib/api-client';
import { useAuth, type AuthUser } from '../../../store/auth.store';

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      setSession(data.token, data.user);
      navigate('/tickets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex flex-col gap-4 bg-white p-6 rounded-lg border border-uts-muted shadow-sm"
      >
        <h1 className="text-lg font-semibold">Sign in</h1>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-uts-muted rounded px-3 py-2"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-uts-muted rounded px-3 py-2"
            required
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-brand-steel text-white py-2 rounded font-medium disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-xs text-uts-nav">Demo: jordan.alvarez@student.university.edu / demo1234</p>
      </form>
    </div>
  );
}
