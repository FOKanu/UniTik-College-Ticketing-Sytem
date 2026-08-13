import { FormEvent, useState } from 'react';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { useLogin } from '../hooks/useLogin';

// NFR-1.2: ticket portal login, credentials required.
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useLogin();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h1 className="text-lg font-semibold text-gray-900">Sign in</h1>
      <Input
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
      {/* TODO: add an SSO login option once university SSO/LDAP is confirmed (OI-01). */}
    </form>
  );
}
