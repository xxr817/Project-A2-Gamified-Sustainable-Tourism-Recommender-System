import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../ui.jsx'
import { supabase } from '../supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/app')
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-2">
      <div className="gradient-forest text-white p-12 flex flex-col justify-between">
        <Logo />
        <div>
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Welcome back.<br />Continue planning.
          </h2>
          <p className="mt-4 text-moss-100 max-w-md">
            Sign in to view your trips, challenges, and leaderboard rank.
          </p>
        </div>
        <div className="text-xs text-moss-200">Lab Course · TUM CM · SS 2026</div>
      </div>

      <div className="p-12 flex flex-col justify-center max-w-md mx-auto w-full">
        <Link to="/" className="text-sm text-mute hover:text-forest-700 mb-6 inline-flex items-center gap-1">
          ← Back
        </Link>

        <h3 className="font-display text-3xl font-bold">Sign in to EcoTrail</h3>
        <p className="text-sm text-inkSoft mt-1">Use Google or your email.</p>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="mt-6 flex items-center justify-center gap-2 border border-forest-100 rounded-xl py-2.5 hover:bg-forest-50 text-sm disabled:opacity-50"
        >
          <span className="font-bold">G</span>
          {googleLoading ? 'Connecting…' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3 my-5 text-xs text-mute">
          <div className="flex-1 h-px bg-forest-100" />
          <span>or</span>
          <div className="flex-1 h-px bg-forest-100" />
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-inkSoft">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-moss-200 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-inkSoft">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-moss-200 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full gradient-forest text-white font-semibold rounded-xl py-3 hover:opacity-95 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-rose-600">{error}</p>
        )}

        <p className="text-sm text-inkSoft mt-6 text-center">
          New here? <Link to="/signup" className="text-forest-700 font-semibold">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
