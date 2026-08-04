import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { Button, Input } from '@/components/ui'
import { authApi, isApiError } from '@/lib/api'
import { homePathForRole } from '@/lib/auth'
import { findInstitution, institutionEmailHint } from '@/lib/institutions'
import { loginSchema, type LoginFormValues } from '@/lib/validation'
import { mockAccounts } from '@/mocks/data'
import { useAuthStore, useInstitutionStore } from '@/stores'
import styles from './AuthPages.module.css'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)
  const institutionId = useInstitutionStore((s) => s.institutionId)
  const institution = findInstitution(institutionId)
  const emailHint = institutionEmailHint(institution)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'amara.k@stud.university.edu',
      password: 'password',
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
        isApiError(err)
          ? err.message
          : 'Unable to sign in. Please try again.',
      )
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Sign in to {institution.short}</h1>
      <p className={styles.hint}>
        Signing in to <strong>{institution.name}</strong>.{' '}
        <Link to={ROUTES.institution}>Choose a different institution</Link>
      </p>
      <form
        className={styles.form}
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        noValidate
      >
        <Input
          id="login-email"
          label="University Email"
          type="email"
          placeholder={emailHint}
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
        {apiError ? <p className={styles.error} role="alert">{apiError}</p> : null}
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
        <p>Demo accounts (work for any selected campus)</p>
        <ul>
          {mockAccounts.map((account) => (
            <li key={account.id}>
              <button
                type="button"
                aria-label={`Fill demo credentials for ${account.role}`}
                onClick={() => {
                  setValue('email', account.email)
                  setValue('password', 'password')
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
