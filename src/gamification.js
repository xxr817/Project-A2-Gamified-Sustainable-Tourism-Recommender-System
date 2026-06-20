const LEVELS = [
  { level: 1, name: 'Eco Beginner', minPoints: 0 },
  { level: 2, name: 'Green Starter', minPoints: 100 },
  { level: 3, name: 'Trail Scout', minPoints: 300 },
  { level: 4, name: 'Low-Carbon Local', minPoints: 700 },
  { level: 5, name: 'Eco Pathfinder', minPoints: 1200 },
  { level: 6, name: 'Rail Regular', minPoints: 1800 },
  { level: 7, name: 'Eco Explorer', minPoints: 2400 },
  { level: 8, name: 'Trail Legend', minPoints: 3000 },
]

const EXTRA_LEVEL_STEP = 750

export function getLevelProgress(points = 0) {
  const safePoints = Math.max(0, points)
  const baseLevel = [...LEVELS].reverse().find((item) => safePoints >= item.minPoints)

  if (safePoints >= LEVELS[LEVELS.length - 1].minPoints) {
    const lastLevel = LEVELS[LEVELS.length - 1]
    const extraLevels = Math.floor((safePoints - lastLevel.minPoints) / EXTRA_LEVEL_STEP)
    const level = lastLevel.level + extraLevels
    const levelStart = lastLevel.minPoints + extraLevels * EXTRA_LEVEL_STEP
    const nextLevelAt = levelStart + EXTRA_LEVEL_STEP

    return {
      level,
      levelName: level === lastLevel.level ? lastLevel.name : 'Planet Protector',
      levelStart,
      nextLevelAt,
      pointsToNext: nextLevelAt - safePoints,
      progressPct: Math.min(100, Math.round(((safePoints - levelStart) / (nextLevelAt - levelStart)) * 100)),
    }
  }

  const currentIndex = LEVELS.findIndex((item) => item.level === baseLevel.level)
  const nextLevel = LEVELS[currentIndex + 1]

  return {
    level: baseLevel.level,
    levelName: baseLevel.name,
    levelStart: baseLevel.minPoints,
    nextLevelAt: nextLevel.minPoints,
    pointsToNext: nextLevel.minPoints - safePoints,
    progressPct: Math.min(100, Math.round(((safePoints - baseLevel.minPoints) / (nextLevel.minPoints - baseLevel.minPoints)) * 100)),
  }
}
