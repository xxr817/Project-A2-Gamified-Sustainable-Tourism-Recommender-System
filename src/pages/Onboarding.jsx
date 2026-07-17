import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo, useToast } from '../ui.jsx'
import { useAuth } from '../AuthContext.jsx'
import { supabase } from '../supabase'

const INTERESTS = [
  { id: 'lowCo2',     label: 'Low CO₂',         on: true },
  { id: 'culture',    label: 'Local culture',   on: true },
  { id: 'budget',     label: 'Budget‑friendly', on: false },
  { id: 'offPeak',    label: 'Off‑peak / less crowded', on: true },
  { id: 'family',     label: 'Family with kids', on: false },
  { id: 'accessibility', label: 'Accessibility', on: false },
  { id: 'plant',      label: 'Plant‑based food', on: true },
  { id: 'adventure',  label: 'Adventure',       on: false },
]

const TRANSPORT_PREFS = [
  'Prefer train & bus over flights',
  'Walking + cycling whenever possible',
  'Mix. Show me the greenest realistic option',
]

const PACE_PREFS = [
  'Slow travel (≥4 nights in one place)',
  'Balanced',
  'Fast (city hop)',
]

export default function Onboarding() {
  const navigate = useNavigate()
  const showToast = useToast()
  const { authUser, profile, refreshProfile } = useAuth()

  const [picks, setPicks] = useState(() => Object.fromEntries(INTERESTS.map((i) => [i.id, i.on])))
  const [transport, setTransport] = useState(TRANSPORT_PREFS[0])
  const [pace, setPace] = useState(PACE_PREFS[1])
  const [saving, setSaving] = useState(false)

  // Use the saved profile name in the welcome message.
  const name =
    profile?.first_name ||
    authUser?.user_metadata?.full_name ||
    authUser?.user_metadata?.name ||
    authUser?.email?.split('@')[0] ||
    'there'

  const handleEnter = async () => {
    setSaving(true)

    // Persist preferences to the user's profile. This write is DEFENSIVE:
    // if the `preferences` column hasn't been added yet (see DEPLOY_GUIDE.md),
    // If the profile is missing, log the error and continue.
    // onboarding must never trap the user on this screen.
    if (authUser) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            preferences: {
              interests: picks,
              transport,
              pace,
              updatedAt: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', authUser.id)

        if (error) {
          console.warn('Could not save onboarding preferences:', error.message)
        } else {
          await refreshProfile()
        }
      } catch (err) {
        console.warn('Onboarding preference save failed:', err)
      }
    } else {
      console.warn('No authenticated user during onboarding; preferences not saved.')
    }

    setSaving(false)
    showToast(`Welcome, ${name}! Your preferences are saved 🌱`, 'gold')
    navigate('/app')
  }

  return (
    <div className="min-h-screen grid place-items-center gradient-leaf p-8">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-cardHover border border-forest-100 p-8">
        <div className="flex items-center justify-between">
          <Logo variant="light" />
          <div className="text-xs text-mute">Step 1 of 1 · ~30 seconds</div>
        </div>
        <h3 className="font-display text-3xl font-extrabold mt-6">Tell us how you like to travel</h3>
        <p className="text-inkSoft mt-1">We use this to weight recommendations. You can change everything later.</p>

        <div className="mt-6">
          <div className="text-sm font-semibold mb-2">
            What matters most to you? <span className="text-mute font-normal">(pick all that apply)</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {INTERESTS.map((i) => (
              <label key={i.id} className="rounded-2xl border border-forest-100 p-3 flex items-center gap-2 cursor-pointer hover:bg-forest-50">
                <input
                  type="checkbox"
                  checked={!!picks[i.id]}
                  onChange={(e) => setPicks((p) => ({ ...p, [i.id]: e.target.checked }))}
                />
                {i.label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm font-semibold mb-2">Default transport preference</div>
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-forest-100"
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
            >
              {TRANSPORT_PREFS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">Trip pace</div>
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-forest-100"
              value={pace}
              onChange={(e) => setPace(e.target.value)}
            >
              {PACE_PREFS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-moss-50 border border-moss-100 p-4 text-sm">
          <strong className="text-forest-700">Almost there: </strong>
          <span className="text-inkSoft">Pick what fits you, then jump into EcoTrail and earn your first points.</span>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => navigate('/app')} className="text-sm text-mute hover:text-forest-700">Skip for now</button>
          <button
            onClick={handleEnter}
            disabled={saving}
            className="px-6 py-3 rounded-xl gradient-forest text-white font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Enter EcoTrail →'}
          </button>
        </div>
      </div>
    </div>
  )
}
