// ============================================================================
//  achievements.js — badge auto-unlock + challenge progress/completion engine
// ----------------------------------------------------------------------------
//  EcoTrail tracks three kinds of logged action in `user_activity`:
//    activity_type = 'transport' | 'stay' | 'activity'
//  plus profile-level stats (off_peak_trips, co2_saved_month_kg, trips_count).
//
//  This module turns those into:
//    • badge progress + auto-unlock   -> writes public.user_badges
//    • challenge progress + completion -> writes public.user_challenges + awards reward
//
//  Badges / challenges whose real criteria need data we DON'T have
//  (Strava km, written reviews, nights-per-stay) are intentionally left out of
//  the auto-engine. Challenges in that bucket are completable via a manual
//  "claim" (completeChallengeManually) so a demo can still finish them honestly.
// ============================================================================

import { supabase } from './supabase'
import { getLevelProgress } from './gamification.js'

// --- Badges we can evaluate from tracked data --------------------------------
// metric = a key returned by computeStats(); target = value that means 100%.
const BADGE_DEFS = [
  { id: 'low-carbon-pioneer', metric: 'ecoTransportPoints', target: 100, unit: 'pts' },
  { id: 'off-peak-hero',      metric: 'offPeakTrips',       target: 3,   unit: 'trips' },
  { id: 'rail-romantic',      metric: 'transportCount',     target: 5,   unit: 'trips' },
  { id: 'plant-powered',      metric: 'activityCount',      target: 20,  unit: 'check-ins' },
  { id: 'green-sleeper',      metric: 'stayCount',          target: 5,   unit: 'stays' },
  { id: 'carbon-cutter',      metric: 'co2Month',           target: 100, unit: 'kg' },
]
// Badge ids the engine can actually award. The Badges page shows ONLY these, so
// every visible badge is earnable. The remaining seed badges (Strava km, reviews,
// nights-per-stay, top-50 lists) stay in the DB as documented future work.
export const EARNABLE_BADGE_IDS = BADGE_DEFS.map((d) => d.id)

// --- Challenges we can auto-track --------------------------------------------
// type = which logged action counts; target = how many (counted since joined_at).
const CHALLENGE_DEFS = {
  // Added 2026-07-03 — 4 more auto-tracked challenges (one per Plan tab).
  'c7':  { type: 'activity',  target: 2 },
  'c9':  { type: 'transport', target: 1 },
  'c10': { type: 'stay',      target: 1 },
  'c2':                  { type: 'transport', target: 1 },
  'c3':                  { type: 'transport', target: 1 },
  'c6':                  { type: 'stay',      target: 1 },
}
export const MANUAL_CHALLENGES = new Set()

// ---------------------------------------------------------------------------

async function computeStats(authUser, profile) {
  // Fetch logged actions + fresh profile stats (don't trust possibly-stale context).
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

/**
 * Recompute all badge progress + challenge progress for the user, unlocking and
 * awarding where thresholds are crossed. Safe to call repeatedly (idempotent:
 * a challenge is only completed/rewarded once). Never throws to the UI.
 *
 * @returns {{ newBadges: string[], completedChallenges: {id:string,name:string,reward:number}[] }}
 */
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

    // ---- Badges --------------------------------------------------------------
    // Monotonic: progress only ever goes UP; an earned/demo badge is never re-locked.
    for (const def of BADGE_DEFS) {
      const value = stats[def.metric] || 0
      const progress = pct(value, def.target)
      const prev = existing[def.id]?.progress ?? -1
      if (progress <= prev) continue
      const shown = Math.min(Math.round(value), def.target)
      await upsertBadge(authUser, def.id, progress, `${shown}/${def.target} ${def.unit}`, existing)
      if (progress >= 100 && prev < 100) result.newBadges.push(def.id)
    }

    // ---- Challenges ----------------------------------------------------------
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
        const value = countSince(stats.acts, def.type, row.joined_at)
        const progress = pct(value, def.target)

        if (progress >= 100) {
          await supabase
            .from('user_challenges')
            .update({ completed_at: new Date().toISOString(), is_active: false, progress: { count: value, target: def.target } })
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
            .update({ progress: { count: value, target: def.target } })
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
