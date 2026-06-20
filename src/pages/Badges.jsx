import React, { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { useAuth } from '../AuthContext.jsx'
import { supabase } from '../supabase'
import { syncAchievements, EARNABLE_BADGE_IDS } from '../achievements.js'

export default function Badges() {
  const { authUser, profile } = useAuth()
  const [allBadges, setAllBadges] = useState([])
  const [unlocked, setUnlocked] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)
      // Recompute progress/unlocks before reading, so the page is always current.
      if (authUser) await syncAchievements(authUser, profile)

      const { data: badges } = await supabase
        .from('badges')
        .select('*')
        .order('created_at', { ascending: true })
      // Show only badges the achievement engine can actually award.
      setAllBadges((badges || []).filter((b) => EARNABLE_BADGE_IDS.includes(b.id)))

      if (authUser) {
        const { data: mine } = await supabase
          .from('user_badges')
          .select('badge_id, unlocked_at, progress, progress_text')
          .eq('user_id', authUser.id)
        const map = {}
        ;(mine || []).forEach((b) => { map[b.badge_id] = b })
        setUnlocked(map)
      }
      setLoading(false)
    })()
  }, [authUser, profile])

  const unlockedCount = Object.entries(unlocked)
    .filter(([id, b]) => b.progress >= 100 && EARNABLE_BADGE_IDS.includes(id)).length
  const totalCount = allBadges.length

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold">Badges</h2>
          <p className="text-sm text-inkSoft">
            {loading ? 'Loading…' : `${unlockedCount} unlocked of ${totalCount} · keep going!`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-mute py-8 text-center">Loading badges…</div>
      ) : (
        <div className="grid grid-cols-6 gap-5">
          {allBadges.map((b) => {
            const userBadge = unlocked[b.id]
            const isUnlocked = userBadge && userBadge.progress >= 100
            return isUnlocked
              ? <Unlocked key={b.id} badge={b} unlockedAt={userBadge.unlocked_at} />
              : <Locked key={b.id} badge={b} progress={userBadge?.progress} progressText={userBadge?.progress_text} />
          })}
        </div>
      )}
    </div>
  )
}

function Unlocked({ badge, unlockedAt }) {
  const date = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : ''
  return (
    <div className="rounded-2xl bg-white border border-forest-100 p-5 text-center shadow-card hover:shadow-cardHover transition">
      <div className="w-16 h-16 rounded-full mx-auto gradient-gold grid place-items-center text-forest-800 font-display font-extrabold text-2xl">
        {badge.emoji || '🏅'}
      </div>
      <div className="font-display font-bold text-sm mt-3">{badge.name}</div>
      <div className="text-[11px] text-mute">{badge.detail}</div>
      <div className="text-[10px] text-forest-700 mt-2 font-semibold">Unlocked{date ? ` · ${date}` : ''}</div>
    </div>
  )
}

function Locked({ badge, progress, progressText }) {
  return (
    <div className="rounded-2xl bg-cream border border-dashed border-forest-200 p-5 text-center">
      <div className="w-16 h-16 rounded-full mx-auto bg-white border border-forest-100 grid place-items-center text-mute">
        <Lock size={22} />
      </div>
      <div className="font-display font-bold text-sm mt-3 text-inkSoft">{badge.name}</div>
      <div className="text-[11px] text-mute">{badge.detail}</div>
      {progress != null && progress > 0 && (
        <>
          <div className="h-1.5 rounded-full bg-white mt-3">
            <div className="h-1.5 rounded-full gradient-forest" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-[10px] text-mute mt-1">{progress}%{progressText ? ` · ${progressText}` : ''}</div>
        </>
      )}
    </div>
  )
}
