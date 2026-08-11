import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/app/routes'
import { Button, Input } from '@/components/ui'
import { authApi, isApiError } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { findInstitution, institutionEmailHint } from '@/lib/institutions'
import { registerSchema, type RegisterFormValues } from '@/lib/validation'
import { useAuthStore, useInstitutionStore } from '@/stores'
import styles from './AuthPages.module.css'

export function RegisterPage() {
  const t = useT()
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
      <h1 className={styles.title}>
        {t('auth.joinTitle', { short: institution.short })}
      </h1>
      <p className={styles.hint}>
        {t('auth.creatingFor', { name: institution.name })}{' '}
        <Link to={ROUTES.institution}>{t('auth.chooseDifferent')}</Link>
      </p>
      <form
        className={styles.form}
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        noValidate
      >
        <Input
          id="register-name"
          label={t('auth.fullName')}
          placeholder="Amara Kanu"
          error={errors.displayName?.message}
          {...register('displayName')}
        />
        <Input
          id="register-email"
          label={t('auth.email')}
          type="email"
          placeholder={emailHint}
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          id="register-password"
          label={t('auth.password')}
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          id="register-confirm"
          label={t('auth.confirmPassword')}
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <p className={styles.hint}>
          {t('auth.domainHint', { domains: institution.domains })}
        </p>
        {apiError ? (
          <p className={styles.error} role="alert">
            {apiError}
          </p>
        ) : null}
        <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
          {isSubmitting ? t('auth.creating') : t('auth.createAccount')}
        </Button>
      </form>

      <div className={styles.divider}>
        <span>{t('common.or')}</span>
      </div>

      <Button type="button" variant="secondary" fullWidth disabled>
        {t('auth.sso')}
      </Button>

      <p className={styles.footer}>
        {t('auth.hasAccount')} <Link to={ROUTES.login}>{t('auth.signIn')}</Link>
      </p>
    </div>
  )
}
