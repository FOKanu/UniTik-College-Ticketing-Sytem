import { ROUTES } from '@/app/routes'
import { ButtonLink } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import styles from './AdminDashboardPage.module.css'

export function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.displayName?.split(' ')[0] ?? 'Admin'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {firstName}. Manage TicketHub for MediaDesign Hochschule.</p>
      </header>

      <section className={styles.stats} aria-label="Overview">
        <article>
          <span>Open tickets</span>
          <strong>34</strong>
        </article>
        <article>
          <span>SLA breaches</span>
          <strong>2</strong>
        </article>
        <article>
          <span>Departments</span>
          <strong>4</strong>
        </article>
        <article>
          <span>CSAT</span>
          <strong>4.6</strong>
        </article>
      </section>

      <section className={styles.cards} aria-label="Admin shortcuts">
        <article className={styles.card}>
          <h2>Reports & Analytics</h2>
          <p>Ticket volume, resolution time, and department performance.</p>
          <ButtonLink to={ROUTES.analytics}>Open analytics</ButtonLink>
        </article>
        <article className={styles.card}>
          <h2>People</h2>
          <p>Change staff roles and move employees between departments.</p>
          <ButtonLink to={ROUTES.settingsPeople}>Manage people</ButtonLink>
        </article>
        <article className={styles.card}>
          <h2>Settings</h2>
          <p>Institution profile, departments, people, and knowledge base.</p>
          <ButtonLink to={ROUTES.settings}>Open settings</ButtonLink>
        </article>
        <article className={styles.card}>
          <h2>Staff queue</h2>
          <p>Assign, reassign, or escalate tickets from the live queue.</p>
          <ButtonLink to={ROUTES.queue} variant="secondary">
            Open queue
          </ButtonLink>
        </article>
      </section>
    </div>
  )
}
