import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { apiClient } from '../../../lib/api-client';
import { useAuth, type AuthUser } from '../../../store/auth.store';

interface AuthResponse {
  token: string;
  user: AuthUser;
}

/**
 * Matches the Figma "00 - Sign In" wireframe (file eMdAoJ0lMeFkwPk8TAZviQ,
 * node 85:2). The card layout, spacing, and colors are pulled from that
 * frame; the wireframe's absolute-positioned coordinates are re-expressed as
 * a normal flex layout so the page still works at any viewport size.
 *
 * "Continue with University SSO" and "Forgot password?" are rendered per
 * the design but intentionally disabled — there's no backend support yet
 * (LDAP/SSO is OI-01 in docs/architecture/README.md, and there's no
 * password-reset endpoint). Wiring them up would mean faking success.
 */
// Real accounts created by `python -m scripts.seed` (see backend/scripts/seed.py) —
// not fake credentials, just a shortcut so you don't have to retype them.
// Password for both is "demo1234". Requires Postgres running and seeded.
const DEMO_ACCOUNTS = {
  student: 'jordan.alvarez@student.university.edu',
  staff: 'marcus.whitfield@university.edu',
} as const;
const DEMO_PASSWORD = 'demo1234';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const fillDemoAccount = (which: keyof typeof DEMO_ACCOUNTS) => {
    setEmail(DEMO_ACCOUNTS[which]);
    setPassword(DEMO_PASSWORD);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      setSession(data.token, data.user);
      navigate(data.user.role === 'STUDENT' ? '/dashboard' : '/tickets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center py-10">
      <div className="w-full max-w-[440px] bg-uts-bg border border-[#dedede] rounded-xl p-10">
        <h1 className="text-xl font-semibold text-uts-text text-center">TicketHub</h1>
        <p className="text-[13px] text-uts-text text-center mt-1 mb-6">Sign in to your account</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-uts-text">University Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@stud.university.edu"
              className="h-11 rounded-md border border-[#c7c7c7] bg-[#f3f4ff] px-3 text-[12px] placeholder:text-[#a1a1a1]"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-uts-text">Password</span>
              <button
                type="button"
                disabled
                title="Password reset isn't available yet"
                className="text-[11px] font-medium text-brand-sky opacity-50 cursor-not-allowed"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 rounded-md border border-[#c7c7c7] bg-[#f3f4ff] px-3 text-[12px] placeholder:text-[#a1a1a1]"
              required
            />
          </label>

          {error && <p className="text-[12px] text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-md bg-brand-steel text-white text-[13px] font-medium disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="relative h-px bg-uts-nav mt-1">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-uts-bg px-2 text-[11px] text-uts-nav">
              or
            </span>
          </div>

          <button
            type="button"
            disabled
            title="University SSO isn't wired up yet (see OI-01 in the architecture doc)"
            className="h-11 rounded-md border border-uts-nav bg-white text-[13px] font-medium text-uts-text opacity-50 cursor-not-allowed"
          >
            Continue with University SSO
          </button>
        </form>

        {import.meta.env.DEV && (
          <div className="mt-4 pt-4 border-t border-dashed border-uts-muted">
            <p className="text-[11px] text-uts-nav text-center mb-2">
              Dev only — fill a seeded demo account (still signs in for real)
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => fillDemoAccount('student')}
                className="text-[11px] px-3 py-1.5 rounded border border-uts-muted hover:border-brand-sky"
              >
                Use demo student
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('staff')}
                className="text-[11px] px-3 py-1.5 rounded border border-uts-muted hover:border-brand-sky"
              >
                Use demo staff
              </button>
            </div>
          </div>
        )}
        <p className="text-[12px] text-brand-sky text-center mt-4">
          <Link to="/register">Don&apos;t have an account? Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
