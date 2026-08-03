import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { Button, Input } from '@/components/ui'
import { authApi, isApiError, usesLiveAuth } from '@/lib/api'
import { homePathForRole } from '@/lib/auth'
import { loginSchema, type LoginFormValues } from '@/lib/validation'
import { mockAccounts } from '@/mocks/data'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types'
import styles from './AuthPages.module.css'

/** Mirrors the accounts created by `backend/scripts/seed.py`. */
const SEEDED_ACCOUNTS: User[] = [
  {
    id: 'seed-student',
    email: 'jordan.alvarez@student.university.edu',
    displayName: 'Jordan Alvarez',
    role: 'student',
  },
  {
    id: 'seed-staff',
    email: 'marcus.whitfield@university.edu',
    displayName: 'Marcus Whitfield',
    role: 'agent',
  },
  {
    id: 'seed-admin',
    email: 'elena.voss@university.edu',
    displayName: 'Elena Voss',
    role: 'admin',
  },
]

const SEED_PASSWORD = 'demo1234'
const MOCK_PASSWORD = 'password'

export function LoginPage() {
  const usingMocks = !usesLiveAuth()
  const demoAccounts = usingMocks ? mockAccounts : SEEDED_ACCOUNTS
  const demoPassword = usingMocks ? MOCK_PASSWORD : SEED_PASSWORD
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: demoAccounts[0].email,
      password: demoPassword,
    },
  })

  async function onSubmit(values: LoginFormValues) {
    setApiError(null)
    try {
      const session = await authApi.login(values)
      setSession(session)

      const fromQuery = new URLSearchParams(location.search).get('from')
      const fromState = (
        location.state as { from?: { pathname?: string } } | null
      )?.from?.pathname
      void navigate(
        fromQuery || fromState || homePathForRole(session.user.role),
        { replace: true },
      )
    } catch (err) {
      setApiError(
        isApiError(err) ? err.message : 'Unable to sign in. Please try again.',
      )
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Sign in to your account</h1>
      <form
        className={styles.form}
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        noValidate
      >
        <Input
          id="login-email"
          label="University Email"
          type="email"
          placeholder="you@stud.university.edu"
          autoComplete="username"
          error={errors.email?.message}
          {...register('email', {
            onChange: () => setApiError(null),
          })}
        />
        <div className={styles.passwordField}>
          <Input
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <button type="button" className={styles.forgot} disabled>
            Forgot password?
          </button>
        </div>
        {apiError ? (
          <p className={styles.error} role="alert">
            {apiError}
          </p>
        ) : null}
        <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <Button type="button" variant="secondary" fullWidth disabled>
        Continue with University SSO
      </Button>

      <div className={styles.demos}>
        <p>Demo accounts</p>
        <ul>
          {demoAccounts.map((account) => (
            <li key={account.id}>
              <button
                type="button"
                aria-label={`Fill demo credentials for ${account.role}`}
                onClick={() => {
                  setValue('email', account.email)
                  setValue('password', demoPassword)
                  setApiError(null)
                }}
              >
                <strong>{account.role}</strong>
                <span>{account.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className={styles.footer}>
        Don&apos;t have an account? <Link to={ROUTES.register}>Sign Up</Link>
      </p>
    </div>
  )
}
