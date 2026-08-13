import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '@/app/routes'
import { Button, Input } from '@/components/ui'
import {
  departmentSchema,
  type DepartmentFormValues,
} from '@/lib/validation'
import type { Department } from '@/types'
import styles from './DepartmentsPage.module.css'

interface DeptRule {
  id: string
  name: Department | string
  routing: string
}

const initial: DeptRule[] = [
  { id: '1', name: 'Academics', routing: 'Route to Academics queue' },
  { id: '2', name: 'IT', routing: 'Route to IT queue' },
  { id: '3', name: 'Finance', routing: 'Route to Finance queue' },
  { id: '4', name: 'Maintenance', routing: 'Route to Facilities queue' },
]

export function DepartmentsPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState(initial)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      routing: '',
    },
  })

  function onSubmit(values: DepartmentFormValues) {
    setRows((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: values.name,
        routing:
          values.routing?.trim() || `Route to ${values.name.trim()} queue`,
      },
    ])
    reset()
  }

  function remove(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t('departmentAdmin.title')}</h1><p>{t('departmentAdmin.description')}</p>
        </div>
      </header>

      <div className={styles.banner} role="note">
        {t('departmentAdmin.banner')}{' '}
        <Link to={ROUTES.settingsDepartments}>{t('admin.settings')} → {t('nav.departments')}</Link>.
      </div>

      <form
        className={styles.form}
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        noValidate
      >
        <Input
          id="dept-name"
          label={t('departmentAdmin.name')}
          error={errors.name?.message ? t(errors.name.message) : undefined}
          {...register('name')}
        />
        <Input
          id="dept-routing"
          label={t('departmentAdmin.routing')} placeholder={t('departmentAdmin.routingPlaceholder')}
          error={errors.routing?.message ? t(errors.routing.message) : undefined}
          {...register('routing')}
        />
        <Button type="submit">{t('departmentAdmin.add')}</Button>
      </form>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="sr-only">{t('departmentAdmin.caption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('tickets.department')}</th><th scope="col">{t('departmentAdmin.routing')}</th>
              <th scope="col">
                <span className="sr-only">{t('common.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.routing}</td>
                <td>
                  <Button
                    size="sm"
                    variant="secondary"
                    aria-label={t('departmentAdmin.deleteLabel', { name: row.name })}
                    onClick={() => remove(row.id)}
                  >
                    {t('common.delete')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
