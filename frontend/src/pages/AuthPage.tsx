
import { useState, type FormEvent } from 'react'
import { apiRequest } from '../services/api'

type AuthResponse = {
  success: boolean
  message: string
  token?: string
  data?: {
    id: string
    name: string
    email: string
    role: string
  }
}

type AuthPageProps = {
  onLogin: (token: string) => void
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (mode === 'register' && name.trim().length < 2) {
      setError('Name must contain at least 2 characters.')
      return
    }

    if (password.length < (mode === 'register' ? 8 : 1)) {
      setError(
        mode === 'register'
          ? 'Password must be at least 8 characters.'
          : 'Enter your password.',
      )
      return
    }

    setLoading(true)

    try {
      if (mode === 'register') {
        await apiRequest<AuthResponse>('/auth/register', {
          method: 'POST',
          body: { name: name.trim(), email: email.trim(), password },
        })
      }

      const result = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
      })

      if (!result.token) {
        throw new Error('Login succeeded without returning an authentication token.')
      }

      onLogin(result.token)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  function switchMode(nextMode: 'login' | 'register') {
    setMode(nextMode)
    setError('')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl sm:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Client<span className="text-violet-400">Flow</span>
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Your projects, tasks, and team — all in one workspace.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
              mode === 'login'
                ? 'bg-violet-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
              mode === 'register'
                ? 'bg-violet-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create account
          </button>
        </div>

        <h2 className="text-xl font-semibold">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {mode === 'login'
            ? 'Sign in to continue to your workspace.'
            : 'Get started with your project workspace.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {mode === 'register' && (
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Full name
              </label>
              <input
                id="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-violet-400"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-violet-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={mode === 'register' ? 8 : 1}
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-violet-400"
              placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          ClientFlow · Secure project management
        </p>
      </section>
    </main>
  )
}
