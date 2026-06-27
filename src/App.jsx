// ============================================================================
//  App.jsx — top-level router + shared state (points counter)
// ============================================================================

import React, { useState, useCallback, useMemo, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './ui.jsx'
import AppShell from './Layout.jsx'
import { useAuth } from './AuthContext.jsx'
import { supabase } from './supabase'
import { getLevelProgress } from './gamification.js'
import { syncAchievements } from './achievements.js'

import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Plan from './pages/Plan.jsx'
import Challenges from './pages/Challenges.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Badges from './pages/Badges.jsx'
import Profile from './pages/Profile.jsx'

const UserCtx = createContext(null)
export const useUser = () => useContext(UserCtx)

// ----------------------------------------------------------------------------
//  RequireAuth — protects the /app/* routes.
//  • While the Supabase session is still resolving -> show a loading screen
//    (otherwise we'd flash the login page for a logged-in user on refresh).
//  • If resolved and there is NO user -> redirect to /login.
//  • Otherwise render the protected content.
// ----------------------------------------------------------------------------
function RequireAuth({ children }) {
  const { authUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center gradient-leaf">
        <div className="text-forest-700 font-display text-lg animate-pulse">Loading EcoTrail…</div>
      </div>
    )
  }

  if (!authUser) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  const { authUser, profile, refreshProfile } = useAuth()
  const [points, setPoints] = useState(() => {
    const stored = Number(window.localStorage.getItem('ecotrail-earned-points') || 0)
    return Number.isFinite(stored) ? stored : 0
  })
  const addPoints = useCallback(async (n, activity = {}) => {
    const pointsToAdd = Number(n) || 0

    if (pointsToAdd > 0) {
      setPoints((p) => {
        const nextPoints = p + pointsToAdd
        window.localStorage.setItem('ecotrail-earned-points', String(nextPoints))
        return nextPoints
      })
    }

    if (!authUser) {
      console.warn('No Supabase user found; selection was not saved to backend.')
      return { saved: false, reason: 'not-authenticated' }
    }

    const { error: activityError } = await supabase.from('user_activity').insert({
      user_id: authUser.id,
      activity_type: activity.type || 'points',
      emoji: activity.emoji || '✨',
      title: activity.title || 'Points earned',
      detail: activity.detail || null,
      points_earned: pointsToAdd,
      co2_saved_kg: activity.co2SavedKg || 0,
      background_tone: activity.tone || 'gold',
    })

    if (activityError) {
      console.error('save activity error:', activityError.message)
      return { saved: false, reason: 'activity-error', error: activityError }
    }

    if (pointsToAdd > 0) {
      const totalPoints = (profile?.points ?? 0) + points + pointsToAdd
      const weeklyPoints = (profile?.points_this_week ?? 0) + points + pointsToAdd
      const levelProgress = getLevelProgress(totalPoints)

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          points: totalPoints,
          points_this_week: weeklyPoints,
          level: levelProgress.level,
          level_name: levelProgress.levelName,
          next_level_at: levelProgress.nextLevelAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id)

      if (profileError) {
        console.error('save points error:', profileError.message)
        return { saved: true, profileSaved: false, error: profileError }
      }
    }

    // Re-evaluate badges & challenges now that this action is saved in the DB.
    const achievements = await syncAchievements(authUser, profile)

    if (pointsToAdd > 0) {
      window.localStorage.removeItem('ecotrail-earned-points')
      setPoints(0)
    }
    if (pointsToAdd > 0 || achievements.newBadges.length || achievements.completedChallenges.length) {
      refreshProfile()
    }

    return { saved: true, profileSaved: true, achievements }
  }, [authUser, profile, points, refreshProfile])
  const userValue = useMemo(() => ({ points, addPoints }), [points, addPoints])

  return (
    <ToastProvider>
      <UserCtx.Provider value={userValue}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* App shell + nested pages — gated behind RequireAuth */}
          <Route path="/app" element={<RequireAuth><AppShell points={points} /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="plan" element={<Plan />} />
            <Route path="challenges" element={<Challenges />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="badges" element={<Badges />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </UserCtx.Provider>
    </ToastProvider>
  )
}
