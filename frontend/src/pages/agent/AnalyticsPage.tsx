import { useState } from 'react'
import { Select } from '@/components/ui'
import styles from './AnalyticsPage.module.css'

const volume = [
  { label: 'Wk 1', value: 62 },
  { label: 'Wk 2', value: 74 },
  { label: 'Wk 3', value: 68 },
  { label: 'Wk 4', value: 81 },
]

const departments = [
  { name: 'Academics', open: 9, resolved: 41, avg: '5.1h' },
  { name: 'IT', open: 14, resolved: 63, avg: '3.4h' },
  { name: 'Finance', open: 6, resolved: 28, avg: '6.0h' },
  { name: 'Maintenance', open: 5, resolved: 22, avg: '4.8h' },
]

export function AnalyticsPage() {
  const [range, setRange] = useState('month')
  const max = Math.max(...volume.map((v) => v.value))
  const chartSummary = volume
    .map((item) => `${item.label}: ${item.value} tickets`)
    .join(', ')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Reports & Analytics</h1>
          <p className={styles.soon}>
            Full analytics dashboards — <strong>Soon</strong>
          </p>
        </div>
        <Select
          id="range"
          label="Date range"
          value={range}
          onChange={(e) => setRange(e.target.value)}
          options={[
            { value: 'month', label: 'This Month' },
            { value: 'quarter', label: 'This Quarter' },
            { value: 'year', label: 'This Year' },
          ]}
        />
      </header>

      <section className={styles.stats} aria-label="Key metrics">
        <article>
          <span>Avg Resolution Time</span>
          <strong>4.2h</strong>
        </article>
        <article>
          <span>Tickets Resolved</span>
          <strong>214</strong>
        </article>
        <article>
          <span>CSAT Score</span>
          <strong>4.6 / 5</strong>
        </article>
        <article>
          <span>Recurring Issues</span>
          <strong>3 flagged</strong>
        </article>
      </section>

      <div className={styles.mid}>
        <section className={styles.panel}>
          <h2>Ticket Volume Trend</h2>
          <p className="sr-only" id="volume-chart-summary">
            Weekly ticket volume: {chartSummary}
          </p>
          <ul
            className={styles.bars}
            role="img"
            aria-labelledby="volume-chart-summary"
          >
            {volume.map((item) => (
              <li key={item.label}>
                <div
                  className={styles.bar}
                  style={{ height: `${(item.value / max) * 140}px` }}
                >
                  <span>{item.value}</span>
                </div>
                <small>{item.label}</small>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.recurring}>
          <h2>Recurring Issues</h2>
          <ul>
            <li>
              <strong>VPN certificate expiration</strong>
              <span>12 tickets this month</span>
            </li>
            <li>
              <strong>Printer jams in Library</strong>
              <span>8 tickets this month</span>
            </li>
            <li>
              <strong>Tuition portal timeout</strong>
              <span>6 tickets this month</span>
            </li>
          </ul>
        </section>
      </div>

      <section className={styles.panel}>
        <h2>Department Breakdown</h2>
        <table className={styles.table}>
          <caption className="sr-only">
            Department ticket metrics by open count, resolved count, and average
            resolution time
          </caption>
          <thead>
            <tr>
              <th scope="col">Department</th>
              <th scope="col">Open</th>
              <th scope="col">Resolved</th>
              <th scope="col">Avg Resolution Time</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{row.open}</td>
                <td>{row.resolved}</td>
                <td>{row.avg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
