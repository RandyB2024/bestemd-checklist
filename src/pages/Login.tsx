import { useState } from 'react'
import { LockKeyhole, UserRound } from 'lucide-react'

interface LoginProps {
  onLogin: (actor: 'Randy' | 'Ed') => void
}

export default function Login({
  onLogin,
}: LoginProps) {
  const [actor, setActor] =
    useState<'Randy' | 'Ed'>('Randy')

  const [password, setPassword] =
    useState('')

  const [error, setError] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  async function submit(
    event: React.FormEvent
  ) {
    event.preventDefault()

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        '/api/login',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            actor,
            password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.error ??
          'Inloggen is mislukt.'
        )
        return
      }

      onLogin(actor)
    } catch {
      setError(
        'Er kon geen verbinding worden gemaakt.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo-wrap">
          <img
            src="/bestemd-logo.png"
            alt="Bestemd"
            className="login-logo"
          />
        </div>

        <div className="login-heading">
          <h1>Project Checklist</h1>
          <p>
            Beveiligde werkomgeving voor Randy en Ed.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="login-form"
        >
          <label>
            <span>
              <UserRound size={17} />
              Wie ben je?
            </span>

            <div className="user-switch">
              <button
                type="button"
                className={
                  actor === 'Randy'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setActor('Randy')
                }
              >
                Randy
              </button>

              <button
                type="button"
                className={
                  actor === 'Ed'
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setActor('Ed')
                }
              >
                Ed
              </button>
            </div>
          </label>

          <label>
            <span>
              <LockKeyhole size={17} />
              Wachtwoord
            </span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              autoComplete="current-password"
              autoFocus
              required
            />
          </label>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            className="login-button"
            disabled={loading}
          >
            {loading
              ? 'Inloggen...'
              : 'Inloggen'}
          </button>
        </form>

        <small>
          Alleen toegankelijk voor geautoriseerde gebruikers.
        </small>
      </section>
    </main>
  )
}
