// Updates badge and challenge progress from saved user activity.

import { supabase } from './supabase'
import { getLevelProgress } from './gamification.js'

// Each metric comes from computeStats. The target is the unlock value.
const BADGE_DEFS = [
  { id: 'low-carbon-pioneer', metric: 'ecoTransportPoints', target: 100, unit: 'pts' },
  { id: 'off-peak-hero',      metric: 'offPeakTrips',       target: 3,   unit: 'trips' },
  { id: 'rail-romantic',      metric: 'transportCount',     target: 5,   unit: 'trips' },
  { id: 'plant-powered',      metric: 'activityCount',      target: 20,  unit: 'check-ins' },
  { id: 'green-sleeper',      metric: 'stayCount',          target: 5,   unit: 'stays' },
  { id: 'carbon-cutter',      metric: 'co2Month',           target: 100, unit: 'kg' },
]
// Only tracked badges are shown in the app.
export const EARNABLE_BADGE_IDS = BADGE_DEFS.map((d) => d.id)

// Challenge actions are counted after the join date.
const CHALLENGE_DEFS = {
  'c7':  { type: 'activity',  target: 2 },
  'c9':  { type: 'transport', target: 1 },
  'c10': { type: 'stay',      target: 1 },
  'c2':                  { type: 'transport', target: 1 },
  'c3':                  { type: 'transport', target: 1 },
  'c6':                  { type: 'stay',      target: 1 },
  'c11':                 { kind: 'inactivity', months: 6 },
}
export const MANUAL_CHALLENGES = new Set()

const TRAVEL_ACTIVITY_TYPES = new Set(['transport', 'stay', 'food', 'activity'])

async function computeStats(authUser, profile) {
  // Read fresh activity and profile values from Supabase.
  const [{ data: acts }, { data: prof }] = await Promise.all([
    supabase
      .from('user_activity')
      .select('activity_type, points_earned, created_at')
      .eq('user_id', authUser.id),
    supabase
      .from('profiles')
      .select('off_peak_trips, co2_saved_month_kg')
      .eq('id', authUser.id)
      .single(),
  ])
  const a = acts || []
  const count = (t) => a.filter((r) => r.activity_type === t).length
  const sumPts = (t) => a.filter((r) => r.activity_type === t).reduce((s, r) => s + (r.points_earned || 0), 0)
  return {
    acts: a,
    ecoTransportPoints: sumPts('transport'),
    transportCount: count('transport'),
    stayCount: count('stay'),
    activityCount: count('activity'),
    offPeakTrips: prof?.off_peak_trips ?? profile?.off_peak_trips ?? 0,
    co2Month: Number(prof?.co2_saved_month_kg ?? profile?.co2_saved_month_kg ?? 0),
  }
}

function countSince(acts, type, since) {
  const from = since ? new Date(since).getTime() : 0
  return acts.filter((r) => r.activity_type === type && new Date(r.created_at).getTime() >= from).length
}

function addMonths(value, months) {
  const date = new Date(value)
  const day = date.getDate()
  date.setDate(1)
  date.setMonth(date.getMonth() + months)
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(day, lastDay))
  return date
}

export function inactivityProgress(acts, joinedAt, months = 6, now = new Date()) {
  const joined = new Date(joinedAt)
  const travelActions = acts
    .filter((row) => TRAVEL_ACTIVITY_TYPES.has(row.activity_type))
    .map((row) => new Date(row.created_at))
    .filter((date) => !Number.isNaN(date.getTime()) && date >= joined && date <= now)
  const quietSince = travelActions.reduce((latest, date) => date > latest ? date : latest, joined)
  const completesAt = addMonths(quietSince, months)
  const totalMs = Math.max(1, completesAt.getTime() - quietSince.getTime())
  const quietMs = Math.max(0, now.getTime() - quietSince.getTime())
  const count = Math.min(Math.floor(quietMs / 86400000), Math.ceil(totalMs / 86400000))
  const target = Math.ceil(totalMs / 86400000)
  return { count, target, complete: now >= completesAt, quietSince: quietSince.toISOString() }
}

function pct(value, target) {
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)))
}

// Upsert a single badge row, preserving the original unlocked_at once set.
async function upsertBadge(authUser, badgeId, progress, progressText, existing) {
  const prior = existing[badgeId]
  const unlocked_at =
    progress >= 100
      ? (prior && prior.progress >= 100 && prior.unlocked_at) || new Date().toISOString()
      : prior?.unlocked_at || new Date().toISOString()
  await supabase.from('user_badges').upsert(
    { user_id: authUser.id, badge_id: badgeId, progress, progress_text: progressText, unlocked_at },
    { onConflict: 'user_id,badge_id' },
  )
}

// Recalculate badge and challenge progress.
export async function syncAchievements(authUser, profile) {
  const result = { newBadges: [], completedChallenges: [] }
  if (!authUser) return result

  try {
    const stats = await computeStats(authUser, profile)

    const { data: ubRows } = await supabase
      .from('user_badges')
      .select('badge_id, progress, unlocked_at')
      .eq('user_id', authUser.id)
    const existing = {}
    ;(ubRows || []).forEach((b) => { existing[b.badge_id] = b })

    // Badge progress does not move backwards.
    for (const def of BADGE_DEFS) {
      const value = stats[def.metric] || 0
      const progress = pct(value, def.target)
      const prev = existing[def.id]?.progress ?? -1
      if (progress <= prev) continue
      const shown = Math.min(Math.round(value), def.target)
      await upsertBadge(authUser, def.id, progress, `${shown}/${def.target} ${def.unit}`, existing)
      if (progress >= 100 && prev < 100) result.newBadges.push(def.id)
    }

    const { data: ucRows } = await supabase
      .from('user_challenges')
      .select('challenge_id, joined_at, is_active, completed_at')
      .eq('user_id', authUser.id)
      .eq('is_active', true)

    const active = (ucRows || []).filter((r) => !r.completed_at && CHALLENGE_DEFS[r.challenge_id])
    if (active.length) {
      const { data: chRows } = await supabase
        .from('challenges')
        .select('id, name, reward')
        .in('id', active.map((r) => r.challenge_id))
      const chMap = {}
      ;(chRows || []).forEach((c) => { chMap[c.id] = c })

      let awarded = 0
      for (const row of active) {
        const def = CHALLENGE_DEFS[row.challenge_id]
        const inactivity = def.kind === 'inactivity'
          ? inactivityProgress(stats.acts, row.joined_at, def.months)
          : null
        const value = inactivity?.count ?? countSince(stats.acts, def.type, row.joined_at)
        const target = inactivity?.target ?? def.target
        const progress = pct(value, target)

        if (inactivity?.complete || progress >= 100) {
          await supabase
            .from('user_challenges')
            .update({ completed_at: new Date().toISOString(), is_active: false, progress: { count: value, target, unit: inactivity ? 'days' : undefined } })
            .eq('user_id', authUser.id)
            .eq('challenge_id', row.challenge_id)
          const reward = chMap[row.challenge_id]?.reward || 0
          awarded += reward
          result.completedChallenges.push({ id: row.challenge_id, name: chMap[row.challenge_id]?.name || row.challenge_id, reward })
          if (def.unlockBadge && (existing[def.unlockBadge]?.progress ?? 0) < 100) {
            await upsertBadge(authUser, def.unlockBadge, 100, 'Challenge complete', existing)
            result.newBadges.push(def.unlockBadge)
          }
        } else {
          await supabase
            .from('user_challenges')
            .update({ progress: { count: value, target, unit: inactivity ? 'days' : undefined, quiet_since: inactivity?.quietSince } })
            .eq('user_id', authUser.id)
            .eq('challenge_id', row.challenge_id)
        }
      }
      if (awarded > 0) await awardPoints(authUser, awarded)
    }
  } catch (err) {
    console.warn('syncAchievements failed (non-fatal):', err)
  }

  return result
}

/**
 * Manually complete a challenge that can't be auto-tracked. Awards its reward
 * and unlocks any tied badge. Returns the challenge info or null.
 */
export async function completeChallengeManually(authUser, challengeId) {
  if (!authUser) return null
  try {
    const { data: ch } = await supabase.from('challenges').select('id, name, reward').eq('id', challengeId).single()
    await supabase
      .from('user_challenges')
      .update({ completed_at: new Date().toISOString(), is_active: false, progress: { manual: true } })
      .eq('user_id', authUser.id)
      .eq('challenge_id', challengeId)
    const reward = ch?.reward || 0
    if (reward > 0) await awardPoints(authUser, reward)
    return { id: challengeId, name: ch?.name || challengeId, reward }
  } catch (err) {
    console.warn('completeChallengeManually failed:', err)
    return null
  }
}

// Add reward points to the profile and recompute level (separate from the
// click-to-earn buffer in App.jsx; challenge rewards are their own event).
async function awardPoints(authUser, amount) {
  const { data: p } = await supabase
    .from('profiles')
    .select('points, points_this_week')
    .eq('id', authUser.id)
    .single()
  const points = (p?.points ?? 0) + amount
  const weekly = (p?.points_this_week ?? 0) + amount
  const lp = getLevelProgress(points)
  await supabase
    .from('profiles')
    .update({
      points,
      points_this_week: weekly,
      level: lp.level,
      level_name: lp.levelName,
      next_level_at: lp.nextLevelAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', authUser.id)
  await supabase.from('user_activity').insert({
    user_id: authUser.id,
    activity_type: 'points',
    emoji: '🏆',
    title: 'Challenge reward',
    detail: `+${amount} pts for completing a challenge`,
    points_earned: amount,
    co2_saved_kg: 0,
    background_tone: 'gold',
  })
}
