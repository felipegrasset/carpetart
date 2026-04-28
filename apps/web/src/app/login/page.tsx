'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If already logged in, go to dashboard
  useEffect(() => {
    if (!loading && session) router.replace('/dashboard')
  }, [session, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setSubmitting(false); return }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setSubmitting(false); return }
      if (data.session) {
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ name: email.split('@')[0] }),
        })
      }
    }

    // onAuthStateChange in AuthProvider will update session → useEffect above redirects
    router.replace('/dashboard')
  }

  if (loading || session) return null

  return (
    <main className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-8 text-center">CarpetArt</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required
            className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-400"
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} required
            className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-400"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={submitting}
            className="px-4 py-3 rounded-lg bg-white text-gray-900 font-semibold hover:bg-gray-200 disabled:opacity-50 transition"
          >
            {submitting ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-gray-400 text-sm">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button className="text-white underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </main>
  )
}
