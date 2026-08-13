import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const [range, setRange] = useState('month')
  const max = Math.max(...volume.map((v) => v.value))
  const chartSummary = volume
    .map((item) => `${item.label}: ${item.value} tickets`)
    .join(', ')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t('analytics.title')}</h1>
          <p className={styles.soon}>
            {t('analytics.fullSoon')} <strong>{t('common.soon')}</strong>
          </p>
        </div>
        <Select
          id="range"
          label={t('analytics.dateRange')}
          value={range}
          onChange={(e) => setRange(e.target.value)}
          options={[
            { value: 'month', label: t('analytics.month') }, { value: 'quarter', label: t('analytics.quarter') }, { value: 'year', label: t('analytics.year') },
          ]}
        />
      </header>

      <section className={styles.stats} aria-label={t('analytics.metrics')}>
        <article>
          <span>{t('analytics.avgResolution')}</span>
          <strong>4.2h</strong>
        </article>
        <article>
          <span>{t('analytics.ticketsResolved')}</span>
          <strong>214</strong>
        </article>
        <article>
          <span>{t('analytics.csat')}</span>
          <strong>4.6 / 5</strong>
        </article>
        <article>
          <span>{t('analytics.recurring')}</span>
          <strong>{t('analytics.flagged', { count: 3 })}</strong>
        </article>
      </section>

      <div className={styles.mid}>
        <section className={styles.panel}>
          <h2>{t('analytics.trend')}</h2>
          <p className="sr-only" id="volume-chart-summary">
            {t('analytics.weekly', { summary: chartSummary })}
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
          <h2>{t('analytics.recurring')}</h2>
          <ul>
            <li>
              <strong>{t('analytics.vpn')}</strong><span>{t('analytics.thisMonth', { count: 12 })}</span>
            </li>
            <li>
              <strong>{t('analytics.printer')}</strong><span>{t('analytics.thisMonth', { count: 8 })}</span>
            </li>
            <li>
              <strong>{t('analytics.tuition')}</strong><span>{t('analytics.thisMonth', { count: 6 })}</span>
            </li>
          </ul>
        </section>
      </div>

      <section className={styles.panel}>
        <h2>{t('analytics.breakdown')}</h2>
        <table className={styles.table}>
          <caption className="sr-only">
            {t('analytics.caption')}
          </caption>
          <thead>
            <tr>
              <th scope="col">{t('tickets.department')}</th><th scope="col">{t('common.open')}</th><th scope="col">{t('common.resolved')}</th><th scope="col">{t('analytics.avgResolution')}</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((row) => (
              <tr key={row.name}>
                <td>{t(`departments.${row.name === 'IT' ? 'it' : row.name.toLowerCase()}`)}</td>
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
