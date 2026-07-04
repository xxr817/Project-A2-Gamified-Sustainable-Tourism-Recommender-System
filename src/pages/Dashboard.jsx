import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CrowdBar, Modal, Dot } from '../ui.jsx'
import { useAuth } from '../AuthContext.jsx'
import { useUser } from '../App.jsx'
import { supabase } from '../supabase'
import { getLevelProgress } from '../gamification.js'

const greetingFor = (hour) => {
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const firstName = (authUser, profile) =>
  profile?.first_name ||
  authUser?.user_metadata?.full_name?.split(' ')[0] ||
  authUser?.user_metadata?.name?.split(' ')[0] ||
  authUser?.email?.split('@')[0] ||
  'there'

export default function Dashboard() {
  const navigate = useNavigate()
  const { authUser, profile } = useAuth()
  const { points: earnedPoints } = useUser()

  const [destinations, setDestinations] = useState([])
  const [transportModes, setTransportModes] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [openTrip, setOpenTrip] = useState(null)
  const [rank, setRank] = useState(null)

  useEffect(() => {
    (async () => {
      const [destRes, modeRes] = await Promise.all([
        supabase.from('destinations').select('*').order('green_score', { ascending: false }).limit(3),
        supabase.from('transport_modes').select('*').order('co2_grams_per_km', { ascending: true }),
      ])
      if (destRes.data) setDestinations(destRes.data)
      if (modeRes.data) setTransportModes(modeRes.data)
    })()
  }, [])

  useEffect(() => {
    if (!authUser) return
    let query = supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', authUser.id)
    if (profile?.join_date) {
      query = query.gte('created_at', profile.join_date)
    }
    query
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => setRecentActivity(data || []))
  }, [authUser, profile?.join_date])

  // Weekly rank = your position on the points_this_week leaderboard.
  useEffect(() => {
    if (!authUser) { setRank(null); return }
    supabase
      .from('profiles')
      .select('id, points_this_week')
      .order('points_this_week', { ascending: false })
      .then(({ data }) => {
        if (!data) { setRank(null); return }
        const ranked = data.filter((p) => (p.points_this_week || 0) > 0 || p.id === authUser.id)
        const idx = ranked.findIndex((p) => p.id === authUser.id)
        setRank(idx >= 0 ? idx + 1 : null)
      })
  }, [authUser, profile?.points_this_week])

  const name = firstName(authUser, profile)
  const greeting = greetingFor(new Date().getHours())
  const points = (profile?.points ?? 0) + earnedPoints
  const levelProgress = getLevelProgress(points)
  const nextLevelAt = levelProgress.nextLevelAt
  const level = levelProgress.level
  const levelName = levelProgress.levelName
  const co2Month = profile?.co2_saved_month_kg ?? 0
  const pointsWeek = (profile?.points_this_week ?? 0) + earnedPoints
  const offPeakTrips = profile?.off_peak_trips ?? 0
  const progressPct = levelProgress.progressPct
  const isNewbie = level === 1 && points === 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 rounded-3xl gradient-forest text-white p-7 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-gold-300/15" />
          <div className="relative">
            <div className="text-xs uppercase tracking-widest text-moss-200">{greeting}, {name}</div>
            <h1 className="font-display text-3xl font-extrabold mt-1">
              {isNewbie
                ? <>Welcome to EcoTrail. <span className="text-gold-300">Plan your first green trip</span> to earn points.</>
                : <>You're {levelProgress.pointsToNext} points from{' '}
                    <span className="text-gold-300">Level {level + 1}</span></>
              }
            </h1>
            <div className="mt-3 inline-flex items-center rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold text-moss-100">
              Level {level} · {levelName}
            </div>
            <div className="mt-5 h-2 rounded-full bg-white/20 max-w-xl">
              <div className="h-2 rounded-full gradient-gold" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="mt-2 text-xs text-moss-200">
              {points.toLocaleString()} / {nextLevelAt.toLocaleString()} pts
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button onClick={() => navigate('/app/plan')} className="px-4 py-2.5 rounded-full bg-white text-forest-700 text-sm font-semibold">
                Plan a green trip
              </button>
              <button onClick={() => navigate('/app/challenges')} className="px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold">
                View challenges
              </button>
            </div>
          </div>
        </div>
        <LevelMountain
          level={level}
          levelName={levelName}
          nextLevel={level + 1}
          points={points}
          nextLevelAt={nextLevelAt}
          progressPct={progressPct}
          pointsToNext={levelProgress.pointsToNext}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Kpi dot="bg-forest-500" label="CO₂ saved · month" big={`${co2Month} kg`}
             note={isNewbie ? 'Plan your first trip to start' : '▲ vs last month'} valueClass="text-forest-700" />
        <Kpi dot="bg-gold-300"   label="Points · week"     big={pointsWeek > 0 ? `+${pointsWeek}` : '0'}
               valueClass="text-gold-500" />
        <Kpi dot="bg-forest-400" label="rank"         big={rank ? `#${rank}` : '—'}
             note="this week" />
      </div>

      <div className="grid grid-cols-12 gap-6">


        <div className="col-span-8 rounded-3xl bg-white border border-forest-100 p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg">Which transport to pick?</h3>
              <p className="text-xs text-mute mt-1">CO₂ per passenger-km, Europe average — source: European Environment
                Agency, 2023.</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Dot color="bg-forest-500"/><span className="text-inkSoft">Greenest</span>
              <Dot color="bg-gold-300"/><span className="text-inkSoft ml-1">Mid</span>
              <span className="dot ml-3" style={{background: '#EF4444'}}/><span className="text-inkSoft">High</span>
            </div>
          </div>
          <div className="mt-5 space-y-2.5">
            {transportModes.map((row) => (
                <div key={row.id} className="grid grid-cols-12 items-center gap-3 text-sm">
                  <div className="col-span-2">{row.emoji} {row.mode}</div>
                  <div className="col-span-9 h-4 rounded-full bg-cream border border-forest-100">
                    <div
                        className="bar h-4 rounded-full"
                        style={{
                          width: `${Math.max(1, row.relative_emission)}%`,
                          background:
                              row.tone === 'forest' ? '#3A7A43' :
                                  row.tone === 'moss' ? '#7DA34A' :
                                      row.tone === 'gold' ? '#EF9F35' : '#EF4444',
                        }}
                    />
                  </div>
                  <div
                      className="col-span-1 text-right text-mute">{row.co2_grams_per_km === 0 ? '≈0 g' : `${row.co2_grams_per_km} g`}</div>
                </div>
            ))}
          </div>
        </div>

        <div className="col-span-4 rounded-3xl bg-white border border-forest-100 p-6 shadow-card">
          <h3 className="font-display font-bold text-lg">Recent activity</h3>
          {recentActivity.length === 0 ? (
              <div className="mt-4 text-sm text-mute py-4">
                No activity yet — your eco-actions will show up here once you start planning trips and joining
                challenges.
              </div>
          ) : (
              <ul className="mt-4 space-y-4 text-sm">
                {recentActivity.map((a) => (
                    <li key={a.id} className="flex items-start gap-3">
                      <span
                          className={`w-8 h-8 rounded-full bg-${a.background_tone || 'forest'}-50 grid place-items-center`}>{a.emoji}</span>
                      <div className="flex-1">
                        <div><strong>{a.title}</strong> {a.detail}</div>
                        <div className="text-xs text-mute">{new Date(a.created_at).toLocaleString()}</div>
                      </div>
                      {a.points_earned > 0 && (
                          <span
                              className="text-xs font-semibold text-gold-500">+{a.points_earned} pt{a.points_earned > 1 ? 's' : ''}</span>
                      )}
                    </li>
                ))}
              </ul>
          )}
        </div>
      </div>


      <Modal
          open={!!openTrip}
          onClose={() => setOpenTrip(null)}
          title={openTrip?.name || ''}
          footer={
            <>
              <button onClick={() => setOpenTrip(null)}
                      className="px-4 py-2 rounded-xl border border-forest-100">Close
              </button>
              <button
                  onClick={() => {
                    setOpenTrip(null);
                    navigate('/app/plan')
                  }}
                  className="px-4 py-2 rounded-xl gradient-forest text-white font-semibold"
              >
                Plan this trip →
              </button>
            </>
          }
      >
        <p className="text-inkSoft">{openTrip?.detail}</p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <ModalKpi label="Best transport" value="🚆 Train"/>
          <ModalKpi label="CO₂ vs flight" value="−75%" valueClass="text-forest-700"/>
          <ModalKpi label="Reward" value={`+${openTrip?.points_reward ?? 0} pts`} valueClass="text-gold-500"/>
        </div>
      </Modal>
    </div>
  )
}

function LevelMountain({ level, levelName, nextLevel, points, nextLevelAt, progressPct, pointsToNext }) {
  const routeStart = { x: 54, y: 154 }
  const routeEnd = { x: 176, y: 58 }
  const routeProgress = Math.max(0, Math.min(100, progressPct))
  const climberX = routeStart.x + ((routeEnd.x - routeStart.x) * routeProgress) / 100
  const climberY = routeStart.y + ((routeEnd.y - routeStart.y) * routeProgress) / 100

  return (
    <div className="col-span-4 rounded-3xl bg-white border border-forest-100 p-6 shadow-card overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-mute">Level climb</div>
          <h3 className="font-display font-bold text-lg mt-1">{levelName}</h3>
        </div>
        <span className="text-[11px] font-semibold text-forest-700 bg-forest-50 border border-forest-100 rounded-full px-2 py-0.5">
          Lv {level}
        </span>
      </div>

      <div className="relative mt-5 h-48 rounded-2xl bg-gradient-to-b from-moss-50 to-cream border border-forest-100 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-forest-100 to-transparent" />
        <div
          className="absolute left-[10%] right-[10%] bottom-7 h-28 bg-moss-200"
          style={{ clipPath: 'polygon(0 100%, 48% 0, 100% 100%)' }}
        />
        <div
          className="absolute left-[18%] right-[18%] bottom-7 h-20 bg-forest-500/80"
          style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }}
        />
        <div className="absolute left-[48%] top-8 h-6 w-8 bg-white/90" style={{ clipPath: 'polygon(50% 0, 0 100%, 100% 100%)' }} />

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 192" preserveAspectRatio="none">
          <line
            x1={routeStart.x}
            y1={routeStart.y}
            x2={routeEnd.x}
            y2={routeEnd.y}
            stroke="rgba(255,255,255,.9)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="1 9"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={routeStart.x}
            y1={routeStart.y}
            x2={climberX}
            y2={climberY}
            stroke="#F4B860"
            strokeWidth="5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <div
          className="absolute grid h-9 w-9 place-items-center rounded-full bg-gold-300 border-2 border-white shadow-card text-lg transition-all"
          style={{ left: `${(climberX / 360) * 100}%`, top: `${(climberY / 192) * 100}%`, transform: 'translate(-50%, -50%)' }}
        >
          🥾
        </div>

        <div className="absolute left-4 bottom-3 text-[11px] font-semibold text-forest-700">Lv {level}</div>
        <div className="absolute left-1/2 -translate-x-1/2 top-2 text-[11px] font-semibold text-forest-700">Lv {nextLevel}</div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-inkSoft">
          <span>{points.toLocaleString()} pts</span>
          <span>{nextLevelAt.toLocaleString()} pts</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-forest-50 border border-forest-100 overflow-hidden">
          <div className="h-full gradient-gold" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="mt-2 text-xs text-mute">{pointsToNext} pts to the next summit</div>
      </div>
    </div>
  )
}

function Kpi({dot, label, big, note, valueClass = ''}) {
  return (
      <div className="rounded-2xl bg-white border border-forest-100 p-5 shadow-card">
        <div className="flex items-center gap-2 text-xs text-mute uppercase tracking-wider">
          <Dot color={dot}/>{label}
        </div>
        <div className={`font-display text-3xl font-extrabold mt-2 ${valueClass}`}>{big}</div>
        <div className="text-xs text-inkSoft mt-1">{note}</div>
      </div>
  )
}

function ModalKpi({label, value, valueClass = ''}) {
  return (
      <div className="rounded-xl bg-cream border border-forest-100 p-3">
        <div className="text-xs text-mute">{label}</div>
        <div className={`font-display font-bold mt-0.5 ${valueClass}`}>{value}</div>
      </div>
  )
}
