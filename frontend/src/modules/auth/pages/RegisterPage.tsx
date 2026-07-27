import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { apiClient } from '../../../lib/api-client';
import { useAuth, type AuthUser } from '../../../store/auth.store';

interface AuthResponse {
  token: string;
  user: AuthUser;
}

/**
 * Matches the Figma "00b - Sign Up" wireframe (file eMdAoJ0lMeFkwPk8TAZviQ,
 * node 85:3) — same conversion notes as LoginPage.tsx (flex layout instead
 * of absolute positions, "Continue with University SSO" rendered but
 * disabled since there's no backend for it).
 *
 * The backend only allows self-registration for the STUDENT role
 * (see backend/app/services/auth.py::register — it 409s for any other
 * role), so this form has no role picker.
 */
export function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient.post<AuthResponse>('/auth/register', {
        email,
        password,
        displayName,
        role: 'STUDENT',
      });
      setSession(data.token, data.user);
      // Self-registration is student-only (see backend/app/services/auth.py),
      // so the new account always lands on the student dashboard.
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center py-10">
      <div className="w-full max-w-[440px] bg-uts-bg border border-[#dedede] rounded-xl p-10">
        <h1 className="text-xl font-semibold text-uts-text text-center">TicketHub</h1>
        <p className="text-[13px] text-uts-text text-center mt-1 mb-6">Create your account</p>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-uts-text">Full Name</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Amara Kanu"
              className="h-11 rounded-md border border-[#c7c7c7] bg-[#f3f4ff] px-3 text-[12px] placeholder:text-[#a1a1a1]"
              required
            />
          </label>

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
            <span className="text-[11px] font-medium text-uts-text">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              className="h-11 rounded-md border border-[#c7c7c7] bg-[#f3f4ff] px-3 text-[12px] placeholder:text-[#a1a1a1]"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-uts-text">Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              className="h-11 rounded-md border border-[#c7c7c7] bg-[#f3f4ff] px-3 text-[12px] placeholder:text-[#a1a1a1]"
              required
            />
          </label>

          <p className="text-[10px] text-uts-nav -mt-2">
            Student and staff accounts are verified via your university email domain.
          </p>

          {error && <p className="text-[12px] text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-md bg-brand-steel text-white text-[13px] font-medium disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create Account'}
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

        <p className="text-[12px] text-brand-sky text-center mt-6">
          <Link to="/login">Already have an account? Sign In</Link>
        </p>
      </div>
    </div>
  );
}
