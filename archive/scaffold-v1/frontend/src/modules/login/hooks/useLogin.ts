import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginService } from '../services/login.service';
import { useAuth } from '../../../hooks/useAuth';
import { LoginCredentials } from '../types/login.types';

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const result = await loginService.login(credentials);
      // TODO: decode role from the real JWT once authentication module issues real tokens.
      setSession(result.token, 'STUDENT');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
