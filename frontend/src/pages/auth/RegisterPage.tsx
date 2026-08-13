import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { Button, Input } from '@/components/ui'
import { authApi, isApiError } from '@/lib/api'
import { findInstitution, institutionEmailHint } from '@/lib/institutions'
import { registerSchema, type RegisterFormValues } from '@/lib/validation'
import { useAuthStore, useInstitutionStore } from '@/stores'
import styles from './AuthPages.module.css'

export function RegisterPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const institutionId = useInstitutionStore((s) => s.institutionId)
  const institution = findInstitution(institutionId)
  const emailHint = institutionEmailHint(institution)
  const [apiError, setApiError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    setApiError(null)
    try {
      const session = await authApi.register({
        displayName: values.displayName,
        email: values.email,
        password: values.password,
      })
      setSession(session)
      void navigate(ROUTES.dashboard, { replace: true })
    } catch (err) {
      setApiError(
        isApiError(err)
          ? err.message
          : 'Unable to create account. Please try again.',
      )
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Join {institution.short}</h1>
      <p className={styles.hint}>
        Creating an account for <strong>{institution.name}</strong>.{' '}
        <Link to={ROUTES.institution}>Choose a different institution</Link>
      </p>
      <form
        className={styles.form}
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        noValidate
      >
        <Input
          id="register-name"
          label="Full Name"
          placeholder="Amara Kanu"
          error={errors.displayName?.message}
          {...register('displayName')}
        />
        <Input
          id="register-email"
          label="University Email"
          type="email"
          placeholder={emailHint}
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          id="register-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          id="register-confirm"
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <p className={styles.hint}>
          Use an @{institution.domains} email for this campus. Student and
          staff accounts are verified via your university email domain.
        </p>
        {apiError ? <p className={styles.error} role="alert">{apiError}</p> : null}
        <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create Account'}
        </Button>
      </form>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <Button type="button" variant="secondary" fullWidth disabled>
        Continue with University SSO
      </Button>

      <p className={styles.footer}>
        Already have an account? <Link to={ROUTES.login}>Sign In</Link>
      </p>
    </div>
  )
}
