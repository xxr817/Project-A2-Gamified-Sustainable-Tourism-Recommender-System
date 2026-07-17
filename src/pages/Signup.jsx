import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../ui.jsx'
import { supabase } from '../supabase'

export default function Signup() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  const handleGoogleSignup = async () => {
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

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/app`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user && fullName) {
      await supabase.from('profiles').update({ first_name: fullName }).eq('id', data.user.id)
    }

    if (data.session) {
      navigate('/app')
    } else {
      setCheckEmail(true)
      setLoading(false)
    }
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen grid grid-cols-2">
        <div className="p-12 flex flex-col justify-center max-w-md mx-auto w-full order-2">
          <Logo variant="light" />
          <h3 className="font-display text-3xl font-bold mt-8">Check your email</h3>
          <p className="text-sm text-inkSoft mt-2">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <p className="text-xs text-mute mt-6">
            Didn't get it? Check spam, or <button onClick={() => setCheckEmail(false)} className="text-forest-700 font-semibold underline">try again</button>.
          </p>
        </div>
        <div className="gradient-forest text-white p-12 flex flex-col justify-between order-1">
          <Logo />
          <h2 className="font-display text-4xl font-extrabold">One last step.</h2>
          <div className="text-xs text-moss-200">Lab Course · TUM CM · SS 2026</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid grid-cols-2">
      <div className="p-12 flex flex-col justify-center max-w-md mx-auto w-full order-2">
        <Link to="/" className="text-sm text-mute hover:text-forest-700 mb-6 inline-flex items-center gap-1">← Back</Link>
        <h3 className="font-display text-3xl font-bold">Create your account</h3>
        <p className="text-sm text-inkSoft mt-1">Takes 30 seconds. No card required.</p>

        <button
          onClick={handleGoogleSignup}
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

        <form onSubmit={handleSignup} className="space-y-3">
          <Field label="Full name" value={fullName} onChange={setFullName} required />
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password" type="password" value={password} onChange={setPassword} required hint="At least 6 characters" />

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full mt-2 gradient-forest text-white font-semibold rounded-xl py-3 hover:opacity-95 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        <p className="text-sm text-inkSoft mt-5 text-center">
          Already a member? <Link to="/login" className="text-forest-700 font-semibold">Sign in</Link>
        </p>
      </div>

      <div className="gradient-forest text-white p-12 flex flex-col justify-between order-1">
        <Logo />
        <div>
          <h2 className="font-display text-4xl font-extrabold leading-tight">Create your EcoTrail account.</h2>
          <p className="mt-4 text-moss-100 max-w-md">
            Plan a trip, compare transport, and earn points for lower carbon choices.
          </p>
          <ul className="mt-6 text-moss-100 space-y-2 text-sm">
            <li>✓ Trip suggestions based on your choices</li>
            <li>✓ Challenges, badges, and points</li>
            <li>✓ Carbon estimates for transport options</li>
          </ul>
        </div>
        <div className="text-xs text-moss-200">
          TUM Lab Course · Summer Semester 2026
        </div>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, required, placeholder, hint }) {
  return (
    <div>
      <label className="text-xs font-semibold text-inkSoft">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-forest-100 focus:border-forest-500 focus:ring-2 focus:ring-moss-200 outline-none"
      />
      {hint && <p className="mt-1 text-[11px] text-mute">{hint}</p>}
    </div>
  )
}
