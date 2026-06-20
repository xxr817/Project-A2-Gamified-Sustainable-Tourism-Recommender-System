import React, { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import { supabase } from '../supabase'

const RANGES = [
  { id: 'week', label: 'This week' },
  { id: 'all',  label: 'All time' },
]

const initialsOf = (name) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0].toUpperCase()).join('') || '?'

const weekOf = () => {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  return monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Leaderboard() {
  const { authUser, profile } = useAuth()
  const [range, setRange] = useState('week')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      setLoading(true)

      const pointsKey = range === 'week' ? 'points_this_week' : 'points'
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, city, level_name, points, points_this_week, co2_saved_total_kg, co2_saved_month_kg')
        .order(pointsKey, { ascending: false })

      const accounts = (data || []).map((p) => ({ ...p, is_real: true }))
      const hasMe = accounts.some((account) => account.id === authUser?.id)
      const accountsWithMe = !hasMe && authUser && profile
        ? [
            ...accounts,
            {
              id: authUser.id,
              first_name: profile.first_name || authUser.email?.split('@')[0] || 'You',
              city: profile.city,
              level_name: profile.level_name,
              points: profile.points ?? 0,
              points_this_week: profile.points_this_week ?? 0,
              co2_saved_total_kg: profile.co2_saved_total_kg ?? 0,
              co2_saved_month_kg: profile.co2_saved_month_kg ?? 0,
              is_real: true,
            },
          ]
        : accounts
      const combined = accountsWithMe
        .filter((u) => (u[pointsKey] || 0) > 0 || u.id === authUser?.id)
        .sort((a, b) => (b[pointsKey] || 0) - (a[pointsKey] || 0))

      setRows(combined)
      setLoading(false)
    })()
  }, [range, authUser, profile])

  const pointsKey = range === 'week' ? 'points_this_week' : 'points'
  const co2Key = range === 'week' ? 'co2_saved_month_kg' : 'co2_saved_total_kg'

  const podium = rows.slice(0, 3)
  const showPodium = podium.length >= 3
  const tableRows = showPodium ? rows.slice(3, 12) : rows.slice(0, 12)
  const myRank = rows.findIndex((r) => r.id === authUser?.id) + 1

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold">Leaderboard</h2>
          <p className="text-sm text-inkSoft">{range === 'week' ? `week of ${weekOf()}` : 'All-time ranking'}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 rounded-full font-semibold ${
                range === r.id
                  ? 'bg-forest-600 text-white'
                  : 'bg-white border border-forest-100 text-inkSoft'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-mute py-8 text-center">Loading…</div>
      ) : rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {showPodium && (
            <div className="grid grid-cols-3 gap-6 items-end">
              <PodiumCard rank={2} traveller={podium[1]} pointsKey={pointsKey} isMe={podium[1].id === authUser?.id} />
              <PodiumCard rank={1} traveller={podium[0]} pointsKey={pointsKey} isMe={podium[0].id === authUser?.id} crown />
              <PodiumCard rank={3} traveller={podium[2]} pointsKey={pointsKey} isMe={podium[2].id === authUser?.id} />
            </div>
          )}

          <div className="rounded-3xl bg-white border border-forest-100 shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream text-xs uppercase tracking-wider text-mute">
                <tr>
                  <th className="text-left p-4">#</th>
                  <th className="text-left p-4">Traveller</th>
                  <th className="text-left p-4">CO₂ saved</th>
                  <th className="text-right p-4">Points</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((u, i) => {
                  const isMe = u.id === authUser?.id
                  const rank = showPodium ? i + 4 : i + 1
                  return (
                    <tr
                      key={u.id}
                      className={`border-t border-forest-100 ${isMe ? 'bg-forest-50' : ''}`}
                    >
                      <td className={`p-4 ${isMe ? 'font-display font-extrabold text-forest-700' : ''}`}>{rank}</td>
                      <td className="p-4">
                        {isMe ? (
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-forest-500 to-moss-400 text-white grid place-items-center font-display font-bold text-xs">
                              {initialsOf(u.first_name || 'You')[0]}
                            </span>
                            <strong>{u.first_name || 'You'} (you)</strong>
                          </div>
                        ) : (
                          u.first_name || 'Anonymous'
                        )}
                      </td>
                      <td className="p-4 text-inkSoft">{Math.round(u[co2Key] || 0)} kg</td>
                      <td className={`p-4 text-right ${isMe ? 'font-display font-extrabold text-forest-700' : 'font-bold'}`}>
                        {(u[pointsKey] || 0).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}

                {myRank > 12 && (
                  <>
                    <tr className="border-t border-forest-100">
                      <td className="p-4 text-mute">…</td>
                      <td className="p-4 text-mute" colSpan={3}>{myRank - 12} more travellers</td>
                    </tr>
                    <tr className="border-t border-forest-100 bg-forest-50">
                      <td className="p-4 font-display font-extrabold text-forest-700">{myRank}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-forest-500 to-moss-400 text-white grid place-items-center font-display font-bold text-xs">
                            {initialsOf(rows[myRank - 1].first_name || 'You')[0]}
                          </span>
                          <strong>{rows[myRank - 1].first_name || 'You'} (you)</strong>
                        </div>
                      </td>
                      <td className="p-4 text-inkSoft">{Math.round(rows[myRank - 1][co2Key] || 0)} kg</td>
                      <td className="p-4 text-right font-display font-extrabold text-forest-700">
                        {(rows[myRank - 1][pointsKey] || 0).toLocaleString()}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {myRank > 0 && (
            <p className="text-xs text-mute text-center">
              You're ranked #{myRank} out of {rows.length} EcoTrail accounts this {range === 'week' ? 'week' : 'all-time'}.
            </p>
          )}
        </>
      )}
    </div>
  )
}

function PodiumCard({ rank, traveller, crown, pointsKey, isMe }) {
  const isFirst = rank === 1
  const order = rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3'
  if (!traveller) return null

  const name = traveller.first_name || 'Anonymous'
  const initials = initialsOf(name)
  const points = traveller[pointsKey] || 0

  return (
    <div className={`rounded-3xl ${isFirst ? 'gradient-forest text-white' : 'bg-white border border-forest-100'} p-6 text-center ${order} relative`}>
      {crown && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gold-300 text-forest-800 text-xs font-display font-extrabold">
          👑 1
        </div>
      )}
      {!isFirst && <div className="text-mute font-display font-extrabold">{rank}</div>}
      <div
        className={`${isFirst ? 'w-20 h-20 mt-3' : 'w-16 h-16 mt-1'} rounded-full mx-auto ${
          isFirst ? 'gradient-gold text-forest-800' : (rank === 2 ? 'bg-gradient-to-br from-moss-300 to-forest-500 text-white' : 'bg-gradient-to-br from-forest-400 to-forest-700 text-white')
        } grid place-items-center font-display font-extrabold ${isFirst ? 'text-2xl' : 'text-xl'}`}
      >
        {initials}
      </div>
      <div className="font-display font-bold mt-2">
        {name}{isMe && <span className={`text-xs ml-1 ${isFirst ? 'text-moss-200' : 'text-forest-700'}`}>(you)</span>}
      </div>
      <div className={`text-xs ${isFirst ? 'text-moss-200' : 'text-mute'}`}>
        {traveller.city?.split(',')[0] || 'Munich'}{traveller.level_name ? ` · ${traveller.level_name}` : ''}
      </div>
      <div className={`mt-3 font-display ${isFirst ? 'text-3xl text-gold-300' : 'text-2xl text-forest-700'} font-extrabold`}>
        {points.toLocaleString()}
      </div>
      <div className={`text-[11px] ${isFirst ? 'text-moss-200' : 'text-mute'}`}>points</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-3xl bg-white border border-forest-100 p-8 shadow-card text-center">
      <h3 className="font-display font-bold text-xl">No travellers yet</h3>
      <p className="text-sm text-inkSoft mt-2">Be the first to climb the board.</p>
    </div>
  )
}
