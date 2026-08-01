import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
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
          <h1>Department Management</h1>
          <p>CRUD for departments and routing rules.</p>
        </div>
      </header>

      <div className={styles.banner} role="note">
        Prefer the new Settings experience? Manage departments under{' '}
        <Link to={ROUTES.settingsDepartments}>Settings → Departments</Link>.
      </div>

      <form
        className={styles.form}
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        noValidate
      >
        <Input
          id="dept-name"
          label="Department name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          id="dept-routing"
          label="Routing rule"
          placeholder="Route to … queue"
          error={errors.routing?.message}
          {...register('routing')}
        />
        <Button type="submit">Add department</Button>
      </form>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="sr-only">Departments and routing rules</caption>
          <thead>
            <tr>
              <th scope="col">Department</th>
              <th scope="col">Routing rule</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
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
                    aria-label={`Delete ${row.name} department`}
                    onClick={() => remove(row.id)}
                  >
                    Delete
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
