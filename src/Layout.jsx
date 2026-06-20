import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Home, Search, Trophy, BarChart3, Award, User, Sparkles, Compass, LogOut,
} from 'lucide-react'
import { Logo } from './ui.jsx'
import { USER } from './data.js'
import { useAuth } from './AuthContext.jsx'
import { getLevelProgress } from './gamification.js'

const navItems = [
  { to: '/app', label: 'Dashboard', icon: Home, end: true },
  { to: '/app/plan', label: 'Plan a trip', icon: Compass },
  { to: '/app/challenges', label: 'Challenges', icon: Trophy, badge: '+20' },
  { to: '/app/leaderboard', label: 'Leaderboard', icon: BarChart3 },
  { to: '/app/badges', label: 'Badges', icon: Award },
  { to: '/app/profile', label: 'Profile & Settings', icon: User },
]

const displayName = (authUser) =>
  authUser?.user_metadata?.full_name ||
  authUser?.user_metadata?.name ||
  authUser?.email?.split('@')[0] ||
  USER.firstName

export default function AppShell({ points: earnedPoints = 0 }) {
  const navigate = useNavigate()
  const { authUser, profile, signOut } = useAuth()
  const name = displayName(authUser)
  const initial = name.trim().charAt(0).toUpperCase()
  const avatarUrl = authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture

  const points = (profile?.points ?? 0) + earnedPoints
  const levelProgress = getLevelProgress(points)
  const level = levelProgress.level
  const levelName = levelProgress.levelName
  const nextLevelAt = levelProgress.nextLevelAt
  const co2Month = profile?.co2_saved_month_kg ?? 0

  const progressPct = levelProgress.progressPct

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-forest-100 bg-white p-5 sticky top-0 h-screen flex flex-col">
        <div onClick={() => navigate('/app')} className="cursor-pointer">
          <Logo variant="light" />
        </div>

        <div className="mt-6 rounded-2xl bg-forest-50 border border-forest-100 p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-gold grid place-items-center text-forest-800 font-display font-extrabold">
              {level}
            </div>
            <div>
              <div className="text-xs text-mute">Level {level}</div>
              <div className="font-display font-bold text-sm leading-tight">{levelName}</div>
            </div>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white">
            <div className="h-1.5 rounded-full gradient-forest transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] mt-1.5">
            <span className="text-inkSoft">{points.toLocaleString()} pts</span>
            <span className="text-mute">{levelProgress.pointsToNext} to L{level + 1}</span>
          </div>
        </div>

        <nav className="mt-6 space-y-1 text-sm">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2 transition ${
                    isActive ? 'bg-forest-50 text-forest-700' : 'text-ink hover:bg-cream'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`w-7 h-7 rounded-lg grid place-items-center ${
                        isActive ? 'bg-forest-100 text-forest-700' : 'bg-cream'
                      }`}
                    >
                      <Icon size={14} />
                    </span>
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-[10px] font-semibold text-gold-500 bg-gold-50 border border-gold-100 rounded-full px-2 py-0.5">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <button
          onClick={handleSignOut}
          className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-inkSoft hover:bg-cream transition"
        >
          <span className="w-7 h-7 rounded-lg grid place-items-center bg-cream">
            <LogOut size={14} />
          </span>
          <span>Sign out</span>
        </button>

        <div className="mt-4 rounded-2xl bg-cream border border-forest-100 p-3 text-xs text-inkSoft">
          <div className="font-semibold text-forest-700 mb-1">CO₂ saved this month</div>
          <div className="font-display text-2xl font-extrabold text-forest-700">{co2Month} kg</div>
          <div className="text-mute mt-1">Start your first green trip to begin tracking</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-forest-100 glass sticky top-0 z-30 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 w-1/2">
            <div className="relative w-full max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
              <input
                placeholder="Search destinations, hotels, restaurants…"
                className="w-full pl-9 pr-4 py-2 rounded-full bg-cream border border-forest-100 focus:bg-white outline-none text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-50 border border-gold-100">
              <Sparkles size={14} className="text-gold-500" />
              <span className="font-display font-extrabold text-gold-500">
                {points.toLocaleString()}
              </span>
              <span className="text-xs text-gold-500">pts</span>
            </div>

            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-9 h-9 rounded-full object-cover border border-forest-100"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-forest-500 to-moss-400 text-white grid place-items-center font-display font-bold">
                {initial}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-8 bg-cream min-w-0 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
