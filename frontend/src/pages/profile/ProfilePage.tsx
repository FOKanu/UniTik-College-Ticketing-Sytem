import { useState } from 'react'
import { Button, Avatar, Input } from '@/components/ui'
import { IconCheck, IconLogout, IconUser } from '@/components/ui/icons'
import { signOut } from '@/lib/api'
import { useAuthStore, useUiStore } from '@/stores'
import styles from './ProfilePage.module.css'

const AVATAR_COLORS = [
  { id: 'steel', value: '#2574A9', label: 'Steel blue' },
  { id: 'navy', value: '#0F3145', label: 'Deep navy' },
  { id: 'teal', value: '#0F766E', label: 'Teal' },
  { id: 'green', value: '#1B6E3C', label: 'Green' },
  { id: 'amber', value: '#B45309', label: 'Amber' },
  { id: 'rose', value: '#A22633', label: 'Rose' },
  { id: 'violet', value: '#6D28D9', label: 'Violet' },
  { id: 'slate', value: '#374151', label: 'Slate' },
] as const

const DEFAULT_COLOR = AVATAR_COLORS[0].value

function roleLabel(role: string | undefined): string {
  if (role === 'agent') return 'Support agent'
  if (role === 'admin') return 'Administrator'
  return 'Student'
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const pushToast = useUiStore((s) => s.pushToast)

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [avatarColor, setAvatarColor] = useState(
    user?.avatarColor ?? DEFAULT_COLOR,
  )

  if (!user) {
    return (
      <div className={styles.page}>
        <p>You need to sign in to view your profile.</p>
      </div>
    )
  }

  const dirty =
    displayName.trim() !== user.displayName ||
    avatarColor !== (user.avatarColor ?? DEFAULT_COLOR)

  function handleSave() {
    const nextName = displayName.trim()
    if (nextName.length < 2) {
      pushToast({
        title: 'Name too short',
        body: 'Please enter at least 2 characters.',
        tone: 'error',
      })
      return
    }
    updateProfile({ displayName: nextName, avatarColor })
    pushToast({
      title: 'Profile updated',
      body: 'Your name and avatar color were saved.',
      tone: 'success',
    })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Profile</h1>
          <p>Manage how you appear across TicketHub.</p>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroAvatar}>
          <Avatar
            name={displayName || user.displayName}
            size="xl"
            color={avatarColor}
          />
        </div>
        <div className={styles.heroCopy}>
          <h2>{displayName || user.displayName}</h2>
          <p>{user.email}</p>
          <span className={styles.rolePill}>{roleLabel(user.role)}</span>
        </div>
      </section>

      <div className={styles.grid}>
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <IconUser width={18} height={18} />
            <h3>Account</h3>
          </header>

          <div className={styles.fields}>
            <Input
              id="profile-name"
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
            <Input
              id="profile-email"
              label="Email"
              value={user.email}
              readOnly
              hint="Email is managed by your institution."
            />
            <div className={styles.metaRow}>
              <div>
                <span className={styles.metaLabel}>Role</span>
                <strong>{roleLabel(user.role)}</strong>
              </div>
              {user.department ? (
                <div>
                  <span className={styles.metaLabel}>Department</span>
                  <strong>{user.department}</strong>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h3>Avatar color</h3>
          </header>
          <p className={styles.hint}>
            Pick a color for your initials badge. Used in the header and
            conversations.
          </p>
          <div
            className={styles.swatches}
            role="radiogroup"
            aria-label="Avatar color"
          >
            {AVATAR_COLORS.map((swatch) => {
              const selected = avatarColor === swatch.value
              return (
                <button
                  key={swatch.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={swatch.label}
                  className={
                    selected ? styles.swatchActive : styles.swatch
                  }
                  style={{ background: swatch.value }}
                  onClick={() => setAvatarColor(swatch.value)}
                >
                  {selected ? (
                    <IconCheck width={16} height={16} aria-hidden />
                  ) : null}
                </button>
              )
            })}
          </div>
          <div className={styles.preview}>
            <Avatar
              name={displayName || user.displayName}
              size="lg"
              color={avatarColor}
            />
            <span>Preview</span>
          </div>
        </section>
      </div>

      <footer className={styles.actions}>
        <Button onClick={handleSave} disabled={!dirty}>
          Save changes
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setDisplayName(user.displayName)
            setAvatarColor(user.avatarColor ?? DEFAULT_COLOR)
          }}
          disabled={!dirty}
        >
          Reset
        </Button>
        <Button
          variant="ghost"
          className={styles.signOut}
          onClick={() => void signOut()}
        >
          <IconLogout width={16} height={16} />
          Sign out
        </Button>
      </footer>
    </div>
  )
}
