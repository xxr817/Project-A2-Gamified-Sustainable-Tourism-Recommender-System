import React, { useEffect, useState } from 'react'
import { useToast } from '../ui.jsx'
import { useAuth } from '../AuthContext.jsx'
import { supabase } from '../supabase'
import { syncAchievements, completeChallengeManually, MANUAL_CHALLENGES } from '../achievements.js'

const LOCAL_JOINED_CHALLENGE = 'ecotrail-joined-challenge'

export default function Challenges() {
  const showToast = useToast()
  const { authUser, profile, refreshProfile } = useAuth()

  const [challenges, setChallenges] = useState([])
  const [joinedMap, setJoinedMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(null)

  const refresh = async () => {
    setLoading(true)

    // Auto-advance / complete any joined challenges before reading them back.
    if (authUser) {
      const ach = await syncAchievements(authUser, profile)
      ach.completedChallenges.forEach((c) =>
        showToast(`Challenge complete: ${c.name} · +${c.reward} pts 🏆`, 'gold'))
      if (ach.completedChallenges.length) refreshProfile()
    }

    const { data: all } = await supabase
      .from('challenges')
      .select('*')
      .order('reward', { ascending: false })
    setChallenges(all || [])

    if (authUser) {
      const { data: mine } = await supabase
        .from('user_challenges')
        .select('challenge_id, is_active, joined_at, completed_at, progress')
        .eq('user_id', authUser.id)
      const map = {}
      ;(mine || []).forEach((uc) => { map[uc.challenge_id] = uc })
      setJoinedMap(map)
    } else {
      const localJoined = window.localStorage.getItem(LOCAL_JOINED_CHALLENGE)
      setJoinedMap(localJoined ? {
        [localJoined]: {
          challenge_id: localJoined,
          is_active: true,
          joined_at: new Date().toISOString(),
          completed_at: null,
        },
      } : {})
    }
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [authUser])

  const handleJoin = async (challenge) => {
    if (joinedChallenges.length > 0) {
      showToast('You can only join one challenge at a time.', 'forest')
      return
    }

    setJoining(challenge.id)
    setJoinedMap({
      [challenge.id]: {
        challenge_id: challenge.id,
        is_active: true,
        joined_at: new Date().toISOString(),
        completed_at: null,
      },
    })
    window.localStorage.setItem(LOCAL_JOINED_CHALLENGE, challenge.id)

    if (!authUser) {
      showToast(`Joined: ${challenge.name}`, 'forest')
      setJoining(null)
      return
    }

    const { error } = await supabase
      .from('user_challenges')
      .upsert({
        user_id: authUser.id,
        challenge_id: challenge.id,
        is_active: true,
        joined_at: new Date().toISOString(),
        completed_at: null,
      }, { onConflict: 'user_id,challenge_id' })
    if (error) {
      showToast(`Joined locally. Backend save failed: ${error.message}`, 'forest')
    } else {
      showToast(`Joined: ${challenge.name}`, 'forest')
      await refresh()
    }
    setJoining(null)
  }

  // For challenges that can't be auto-tracked (reusable bottle, Strava bike):
  // let the user mark them done, which awards the reward honestly.
  const handleManualComplete = async (challenge) => {
    const res = await completeChallengeManually(authUser, challenge.id)
    if (res) {
      showToast(`Challenge complete: ${res.name} · +${res.reward} pts 🏆`, 'gold')
      refreshProfile()
      refresh()
    }
  }

  const joinedChallenges = challenges.filter((c) => joinedMap[c.id]?.is_active && !joinedMap[c.id]?.completed_at)
  const availableChallenges = challenges.filter((c) => !joinedMap[c.id] || joinedMap[c.id]?.completed_at)

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="rounded-3xl bg-white border border-forest-100 p-7 text-sm text-mute text-center">Loading challenges…</div>
      ) : joinedChallenges.length > 0 ? (
        <JoinedCard challenges={joinedChallenges} joinedMap={joinedMap} onManualComplete={handleManualComplete} />
      ) : (
        <NoActiveCard />
      )}

      <div>
        <h3 className="font-display text-xl font-bold">Available challenges</h3>
        <p className="text-sm text-mute">Join any of these to multiply your weekly points.</p>
      </div>

      {availableChallenges.length === 0 && !loading ? (
        <div className="rounded-3xl bg-white border border-forest-100 p-6 text-sm text-mute text-center">
          You've joined every available challenge. Nice.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {availableChallenges.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white border border-forest-100 p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div className="text-2xl">{c.emoji || '🎯'}</div>
                <span className="text-[11px] font-semibold text-gold-500 bg-gold-50 border border-gold-100 rounded-full px-2 py-0.5">
                  +{c.reward} pts
                </span>
              </div>
              <div className="font-display font-bold mt-2">{c.name}</div>
              <p className="text-sm text-inkSoft mt-1">{c.detail}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-mute uppercase tracking-wider">{c.duration || 'open'}</span>
                <button
                  onClick={() => handleJoin(c)}
                  disabled={joining === c.id || joinedChallenges.length > 0}
                  className={`text-sm font-semibold disabled:opacity-50 ${
                    joinedChallenges.length > 0 ? 'text-mute cursor-not-allowed' : 'text-forest-700'
                  }`}
                >
                  {joining === c.id ? 'Joining…' : joinedChallenges.length > 0 ? 'Locked' : 'Join →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function JoinedCard({ challenges, joinedMap, onManualComplete }) {
  return (
    <div className="rounded-3xl bg-white border border-forest-100 p-7 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-mute">Joined challenges</div>
          <h2 className="font-display text-2xl font-extrabold mt-1">Your active challenge{challenges.length > 1 ? 's' : ''}</h2>
          <p className="text-sm text-inkSoft mt-2 max-w-lg">
            Keep these active while planning trips to earn the completion rewards.
          </p>
        </div>
        <div className="rounded-full bg-forest-50 border border-forest-100 px-3 py-1 text-xs font-semibold text-forest-700">
          {challenges.length} active
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="rounded-2xl border border-forest-100 bg-cream p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{challenge.emoji || '🎯'}</div>
              <div className="flex-1">
                <div className="font-display font-bold">{challenge.name}</div>
                <p className="text-sm text-inkSoft mt-1">{challenge.detail}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-mute">
                    Joined {formatJoinedDate(joinedMap[challenge.id]?.joined_at)}
                  </span>
                  <span className="font-semibold text-gold-500 bg-gold-50 border border-gold-100 rounded-full px-2 py-0.5">
                    +{challenge.reward} pts
                  </span>
                </div>
                {(() => {
                  const p = joinedMap[challenge.id]?.progress
                  const hasProg = p && typeof p.target === 'number' && typeof p.count === 'number'
                  const pctVal = hasProg ? Math.min(100, Math.round((p.count / p.target) * 100)) : null
                  return (
                    <>
                      {hasProg && (
                        <div className="mt-3">
                          <div className="h-1.5 rounded-full bg-white">
                            <div className="h-1.5 rounded-full gradient-forest" style={{ width: `${pctVal}%` }} />
                          </div>
                          <div className="text-[10px] text-mute mt-1">{p.count}/{p.target} · {pctVal}%</div>
                        </div>
                      )}
                      {MANUAL_CHALLENGES.has(challenge.id) && (
                        <button
                          onClick={() => onManualComplete(challenge)}
                          className="mt-3 text-xs font-semibold text-forest-700 border border-forest-200 rounded-lg px-3 py-1.5 hover:bg-forest-50"
                        >
                          Mark complete →
                        </button>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatJoinedDate(value) {
  if (!value) return 'today'
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function NoActiveCard() {
  return (
    <div className="rounded-3xl bg-white border border-forest-100 p-7 shadow-card">
      <div className="text-xs uppercase tracking-widest text-mute">No active challenge</div>
      <h2 className="font-display text-2xl font-extrabold mt-1">Pick one below to start</h2>
      <p className="text-sm text-inkSoft mt-2 max-w-lg">
        Join any available challenge to multiply your weekly points. You can only have one active at a time.
      </p>
    </div>
  )
}
