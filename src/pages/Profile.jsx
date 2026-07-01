import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'
import { supabase } from '../supabase'
import { TRANSPORT_OPTIONS } from '../data.js'

const displayName = (authUser, profile) =>
  profile?.first_name ||
  authUser?.user_metadata?.full_name ||
  authUser?.user_metadata?.name ||
  authUser?.email?.split('@')[0] ||
  'There'

function calculateRank(accounts, userId, pointsKey) {
  const ranked = [...accounts]
    .filter((account) => (account[pointsKey] || 0) > 0 || account.id === userId)
    .sort((a, b) => (b[pointsKey] || 0) - (a[pointsKey] || 0))

  const index = ranked.findIndex((account) => account.id === userId)
  return index >= 0 ? index + 1 : null
}

export default function Profile() {
  const navigate = useNavigate()
  const { authUser, profile, refreshProfile, signOut } = useAuth()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ first_name: '', city: '' })
  const [trips, setTrips] = useState([])
  const [activityHistory, setActivityHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [rankInfo, setRankInfo] = useState({ all: null, week: null, total: 0 })
  const [rankLoading, setRankLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name || displayName(authUser, profile),
        city: profile.city || '',
      })
    }
  }, [profile, authUser])

  useEffect(() => {
    if (!authUser) {
      setTrips([])
      setActivityHistory([])
      setHistoryLoading(false)
      return
    }

    setHistoryLoading(true)
    Promise.all([
      supabase
        .from('trips')
        .select('id, start_date, end_date, status, selected_transport_id, points_earned, created_at')
        .eq('user_id', authUser.id)
        .gte('created_at', profile?.join_date || '1970-01-01')
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('user_activity')
        .select('id, activity_type, emoji, title, detail, points_earned, created_at, background_tone')
        .eq('user_id', authUser.id)
        .in('activity_type', ['transport', 'stay', 'activity', 'food'])
        .gte('created_at', profile?.join_date || '1970-01-01')
        .order('created_at', { ascending: false })
        .limit(24),
    ]).then(([tripRes, activityRes]) => {
      setTrips(tripRes.data || [])
      setActivityHistory(activityRes.data || [])
      setHistoryLoading(false)
    })
  }, [authUser, profile?.join_date])

  useEffect(() => {
    if (!authUser) {
      setRankInfo({ all: null, week: null, total: 0 })
      setRankLoading(false)
      return
    }

    setRankLoading(true)
    supabase
      .from('profiles')
      .select('id, first_name, points, points_this_week')
      .then(({ data, error }) => {
        if (error) {
          console.error('rank fetch error:', error.message)
          setRankInfo({ all: null, week: null, total: 0 })
          setRankLoading(false)
          return
        }

        const profiles = data || []
        const hasMe = profiles.some((item) => item.id === authUser.id)
        const accounts = hasMe || !profile
          ? profiles
          : [
              ...profiles,
              {
                id: authUser.id,
                first_name: profile.first_name || authUser.email?.split('@')[0] || 'You',
                points: profile.points ?? 0,
                points_this_week: profile.points_this_week ?? 0,
              },
            ]

        setRankInfo({
          all: calculateRank(accounts, authUser.id, 'points'),
          week: calculateRank(accounts, authUser.id, 'points_this_week'),
          total: accounts.length,
        })
        setRankLoading(false)
      })
  }, [authUser, profile])

  const name = displayName(authUser, profile)
  const initial = name.trim().charAt(0).toUpperCase()
  const avatarUrl = authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture
  const email = authUser?.email || profile?.email || ''
  const tripGroups = buildTripGroups(trips, activityHistory)
  const unattachedActivities = activityHistory.filter((item) => !tripGroups.some((group) =>
    group.transportActivity?.id === item.id || group.attachments.some((attachment) => attachment.id === item.id)
  ))
  const joinDate = profile?.join_date
    ? new Date(profile.join_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : '—'

  const handleSave = async () => {
    if (!authUser) return
    setSaving(true)
    setError(null)
    const { error: err } = await supabase
      .from('profiles')
      .update({
        first_name: form.first_name.trim(),
        city: form.city.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.id)
    if (err) {
      setError(err.message)
    } else {
      await refreshProfile()
      setEditing(false)
    }
    setSaving(false)
  }

  const handleCancel = () => {
    setForm({
      first_name: profile?.first_name || name,
      city: profile?.city || '',
    })
    setError(null)
    setEditing(false)
  }

  const handleResetAccount = async () => {
    if (!authUser) return
    const confirmed = window.confirm('Reset this account data? Points, level, CO₂ saved, trips, active challenges, and local selections will go back to zero.')
    if (!confirmed) return

    setResetting(true)
    setError(null)
    const resetAt = new Date().toISOString()

    await Promise.allSettled([
      supabase.from('trips').delete().eq('user_id', authUser.id),
      supabase.from('user_activity').delete().eq('user_id', authUser.id),
      supabase.from('user_challenges').update({ is_active: false, completed_at: resetAt }).eq('user_id', authUser.id),
    ])

    const { error: resetError } = await supabase
      .from('profiles')
      .update({
        level: 1,
        level_name: 'Eco Beginner',
        points: 0,
        next_level_at: 100,
        points_this_week: 0,
        co2_saved_month_kg: 0,
        co2_saved_total_kg: 0,
        off_peak_trips: 0,
        trips_count: 0,
        join_date: resetAt,
        updated_at: resetAt,
      })
      .eq('id', authUser.id)

    if (resetError) {
      setError(resetError.message)
      setResetting(false)
      return
    }

    window.localStorage.removeItem('ecotrail-earned-points')
    window.localStorage.removeItem('ecotrail-joined-challenge')
    await refreshProfile()
    await signOut()
    navigate('/login')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white border border-forest-100 p-6 shadow-card flex items-center gap-6">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-20 h-20 rounded-full object-cover border border-forest-100"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-forest-500 to-moss-400 text-white grid place-items-center font-display font-extrabold text-3xl">
            {initial}
          </div>
        )}

        <div className="flex-1">
          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="Display name"
                className="px-3 py-2 rounded-xl border border-forest-100 text-lg font-display font-extrabold w-full max-w-xs focus:border-forest-500 focus:ring-2 focus:ring-moss-200 outline-none"
              />
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Home city (e.g. Munich, DE)"
                className="px-3 py-2 rounded-xl border border-forest-100 text-sm w-full max-w-xs focus:border-forest-500 focus:ring-2 focus:ring-moss-200 outline-none"
              />
              <div className="text-sm text-inkSoft">{email}</div>
              {error && <div className="text-sm text-rose-600">{error}</div>}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-extrabold">{name}</h2>
                <span className="text-[11px] font-semibold text-forest-700 bg-forest-50 border border-forest-100 rounded-full px-2 py-0.5">
                  {profile?.level_name ?? 'Eco Beginner'} · Lv {profile?.level ?? 1}
                </span>
              </div>
              <div className="text-sm text-inkSoft">
                {email}
                {profile?.city ? ` · ${profile.city}` : ''}
                {profile?.join_date ? ` · member since ${joinDate}` : ''}
              </div>
              <div className="mt-3 flex items-center gap-6 text-sm">
                <span><strong className="text-forest-700">{profile?.co2_saved_total_kg ?? 0} kg</strong> CO₂ saved</span>
                <span><strong className="text-forest-700">{profile?.trips_count ?? 0}</strong> trips</span>
                <span><strong className="text-forest-700">{profile?.points ?? 0}</strong> pts</span>
                <span><strong className="text-forest-700">#{rankInfo.all ?? '—'}</strong> rank</span>
              </div>
            </>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-forest-600 text-white text-sm font-semibold hover:bg-forest-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-forest-100 text-sm hover:bg-forest-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 rounded-xl border border-forest-100 text-sm hover:bg-forest-50"
          >
            Edit profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 rounded-3xl bg-white border border-forest-100 p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-lg">Rank</h3>
              <p className="text-sm text-inkSoft mt-0.5">Your position among EcoTrail accounts.</p>
            </div>
            <span className="text-[11px] font-semibold text-forest-700 bg-forest-50 border border-forest-100 rounded-full px-2 py-0.5">
              {rankLoading ? 'Loading' : `${rankInfo.total} accounts`}
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <RankStat label="All-time rank" value={rankInfo.all} loading={rankLoading} />
            <RankStat label="This week" value={rankInfo.week} loading={rankLoading} />
          </div>
        </div>

        <div className="col-span-12 rounded-3xl bg-white border border-forest-100 p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-lg">Account reset</h3>
              <p className="text-sm text-inkSoft mt-0.5">
                Clear your current EcoTrail progress and sign out. You can register again or continue with Google afterwards.
              </p>
            </div>
            <button
              onClick={handleResetAccount}
              disabled={resetting}
              className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 disabled:opacity-50"
            >
              {resetting ? 'Resetting…' : 'Reset account data'}
            </button>
          </div>
          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </div>

        <div className="col-span-12 rounded-3xl bg-white border border-forest-100 p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-lg">History</h3>
              <p className="text-sm text-inkSoft mt-0.5">Trip plans are the main record. Stays, restaurants, and activities are shown underneath each trip.</p>
            </div>
            <span className="text-[11px] font-semibold text-forest-700 bg-forest-50 border border-forest-100 rounded-full px-2 py-0.5">
              {trips.length} trip{trips.length === 1 ? '' : 's'}
            </span>
          </div>

          {historyLoading ? (
            <div className="mt-5 rounded-2xl bg-cream border border-forest-100 p-5 text-sm text-mute text-center">
              Loading history…
            </div>
          ) : trips.length === 0 && activityHistory.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-cream border border-forest-100 p-5 text-sm text-mute text-center">
              No history yet. Select transport, stay, or activities from Plan a trip to start recording.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {tripGroups.length === 0 ? (
                <EmptyHistoryLine text="No saved trips yet" />
              ) : tripGroups.map((group) => (
                <TripHistoryItem key={group.trip.id} group={group} />
              ))}
              {unattachedActivities.length > 0 && (
                <div className="rounded-2xl bg-cream border border-forest-100 p-4">
                  <div className="text-xs uppercase tracking-wider text-mute font-semibold">Other selections</div>
                  <div className="mt-3 space-y-2">
                    {unattachedActivities.map((item) => (
                      <ActivityHistoryItem key={item.id} item={item} compact />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function EmptyHistoryLine({ text }) {
  return (
    <div className="rounded-2xl bg-cream border border-forest-100 p-4 text-sm text-mute">
      {text}
    </div>
  )
}

function RankStat({ label, value, loading }) {
  return (
    <div className="rounded-2xl bg-cream border border-forest-100 p-5">
      <div className="text-xs uppercase tracking-wider text-mute font-semibold">{label}</div>
      <div className="mt-2 font-display text-3xl font-extrabold text-forest-700">
        {loading ? '…' : value ? `#${value}` : '—'}
      </div>
    </div>
  )
}

function buildTripGroups(trips, activityHistory) {
  const sortedTrips = [...trips].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const groupedActivityIds = new Set()

  return sortedTrips.map((trip, index) => {
    const tripTime = new Date(trip.created_at).getTime()
    const newerTripTime = index === 0 ? Infinity : new Date(sortedTrips[index - 1].created_at).getTime()

    const related = activityHistory.filter((item) => {
      if (!item.created_at) return false
      const activityTime = new Date(item.created_at).getTime()
      return activityTime >= tripTime - 5 * 60 * 1000 && activityTime < newerTripTime
    })

    const transportActivity = related.find((item) => item.activity_type === 'transport')
      || activityHistory.find((item) => {
        if (item.activity_type !== 'transport') return false
        const activityTime = new Date(item.created_at).getTime()
        return Math.abs(activityTime - tripTime) < 5 * 60 * 1000
      })

    const attachments = related
      .filter((item) => item.activity_type !== 'transport')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

    if (transportActivity) groupedActivityIds.add(transportActivity.id)
    attachments.forEach((item) => groupedActivityIds.add(item.id))

    return { trip, transportActivity, attachments }
  })
}

function TripHistoryItem({ group }) {
  const { trip, transportActivity, attachments } = group
  const transport = TRANSPORT_OPTIONS.find((item) => item.id === trip.selected_transport_id)
  const routeDetail = transportActivity?.detail || transport?.title || 'Route not saved'
  const totalPoints = (trip.points_earned || 0) + attachments.reduce((sum, item) => sum + (item.points_earned || 0), 0)

  return (
    <div className="rounded-3xl bg-white border border-forest-100 shadow-card overflow-hidden">
      <div className="gradient-forest text-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 grid place-items-center text-2xl">
              {transportActivity?.emoji || transport?.emoji || '🧭'}
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-moss-200">Trip planned</div>
              <div className="font-display text-xl font-extrabold mt-0.5">{routeDetail}</div>
              <div className="text-xs text-moss-100 mt-1">
                {formatTripRange(trip.start_date, trip.end_date)} · planned {formatHistoryDate(trip.created_at)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[11px] text-forest-800 bg-white rounded-full px-2 py-0.5 font-semibold">
              {trip.status}
            </span>
            {totalPoints > 0 && (
              <span className="text-xs font-bold text-gold-200">+{totalPoints} pts</span>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        {attachments.length === 0 ? (
          <div className="rounded-2xl bg-cream border border-forest-100 p-3 text-xs text-mute">
            No stay, restaurant, or activity selections attached yet.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-mute font-semibold">Attached choices</div>
            {attachments.map((item) => (
              <ActivityHistoryItem key={item.id} item={item} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ActivityHistoryItem({ item, compact = false }) {
  const label = activityTypeLabel(item.activity_type)

  if (compact) {
    return (
      <div className="rounded-2xl bg-cream border border-forest-100 px-3 py-2 text-sm flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-white border border-forest-100 grid place-items-center text-base">
          {item.emoji || '✨'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-forest-700 bg-forest-50 border border-forest-100 rounded-full px-2 py-0.5">
              {label}
            </span>
            <span className="font-semibold truncate">{item.detail || item.title}</span>
          </div>
          <div className="text-[11px] text-mute mt-0.5">{formatHistoryDate(item.created_at)}</div>
        </div>
        {item.points_earned > 0 && (
          <span className="text-xs font-semibold text-gold-500">+{item.points_earned} pts</span>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-cream border border-forest-100 p-4 text-sm flex items-start gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display font-bold">{item.title}</div>
          <div className="text-xs text-inkSoft mt-1">{item.detail || item.activity_type}</div>
        </div>
        {item.points_earned > 0 && (
          <span className="text-xs font-semibold text-gold-500">+{item.points_earned} pts</span>
        )}
      </div>
      <div className="text-[11px] text-mute mt-2">{formatHistoryDate(item.created_at)}</div>
    </div>
  )
}

function activityTypeLabel(type) {
  if (type === 'stay') return 'Stay'
  if (type === 'activity') return 'Activity'
  if (type === 'food') return 'Restaurant'
  if (type === 'transport') return 'Transport'
  return 'Choice'
}

function formatTripRange(startDate, endDate) {
  if (!startDate && !endDate) return 'Date not set'
  if (!endDate) return formatHistoryDate(startDate)
  return `${formatHistoryDate(startDate)} - ${formatHistoryDate(endDate)}`
}

function formatHistoryDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function ConnectRow({ icon, name, connected }) {
  return (
    <li className="flex items-center justify-between">
      <span>{icon} {name}</span>
      {connected
        ? <span className="text-[11px] text-forest-700 font-semibold">Connected</span>
        : <span className="text-[11px] text-mute cursor-pointer hover:text-forest-700">Connect →</span>}
    </li>
  )
}
