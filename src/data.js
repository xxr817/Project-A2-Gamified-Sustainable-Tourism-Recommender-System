// ============================================================================
//  EcoTrail — shared mock data
// ----------------------------------------------------------------------------
//  All numbers and citations come from the Milestone 1 deck. Do not invent
//  data points: every figure here is traceable to a public source.
// ============================================================================

export const USER = {
  firstName: 'Davide',
  email: 'davidedesigner@googlemail.com',
  city: 'Munich, DE',
  level: 7,
  levelName: 'Eco Explorer',
  points: 2847,
  nextLevelAt: 3000,
  cityRank: 14,
  cityRankOf: 412,
  co2SavedMonthKg: 38.2,
  co2SavedTotalKg: 412,
  pointsThisWeek: 184,
  offPeakTrips: 4,
  badgesUnlocked: 12,
  badgesTotal: 24,
  trips: 9,
  joinDate: 'Jan 2026',
}

// ────────────────────────────────────────────────────────────────────────────
// Transport CO₂ — passenger-km, EU average (European Environment Agency, 2023)
// ────────────────────────────────────────────────────────────────────────────
export const CO2_PER_KM = [
  { mode: 'Walking',       emoji: '🚶', grams: 0,    relative: 1,   tone: 'forest' },
  { mode: 'Cycling',       emoji: '🚲', grams: 0,    relative: 1,   tone: 'forest' },
  { mode: 'Train',         emoji: '🚆', grams: 35,   relative: 14,  tone: 'forest' },
  { mode: 'Bus',           emoji: '🚌', grams: 75,   relative: 30,  tone: 'moss' },
  { mode: 'Car (1 pax)',   emoji: '🚗', grams: 170,  relative: 67,  tone: 'gold' },
  { mode: 'Short flight',  emoji: '✈️', grams: 255,  relative: 100, tone: 'rose' },
]

// ────────────────────────────────────────────────────────────────────────────
// Recommendations for the demo trip (Munich → Lisbon, 15–22 Jun 2026)
// ────────────────────────────────────────────────────────────────────────────
export const RECOMMENDED_TRIPS = [
  {
    id: 'lisbon', name: 'Lisbon, Portugal', tag: 'Off‑peak · June',
    pointsReward: 25, score: 92, nights: 7, fromPrice: '€142 by train',
    crowd: 2, gradient: 'from-moss-300 to-forest-500',
    detail: 'Lisbon is in shoulder season in June — 30% less crowded than July/Aug. Best reached by train via Paris–Hendaye–Lisbon (32 h). 7 nights, from €142 by train.',
  },
  {
    id: 'bohinj', name: 'Bohinj, Slovenia', tag: 'Hidden gem',
    pointsReward: 35, score: 96, nights: 5, fromPrice: '€98 by train',
    crowd: 1, gradient: 'from-forest-400 to-forest-700',
    detail: 'Bohinj Lake (Triglav NP) is a hidden gem — fewer visitors than Bled, 96/100 green‑score. Train via Villach–Jesenice–Bohinjska Bistrica. 5 nights, from €98.',
  },
  {
    id: 'porto', name: 'Porto, Portugal', tag: 'Slow travel',
    pointsReward: 22, score: 88, nights: 6, fromPrice: '€128 by train',
    crowd: 3, gradient: 'from-moss-200 to-moss-500',
    detail: 'Porto rewards slow travel: 6 nights of food, port wine cellars and Douro Valley day‑trips. Direct night train from Hendaye after the Paris leg. From €128.',
  },
]

// ────────────────────────────────────────────────────────────────────────────
// Plan a Trip — Transport options for Munich → Lisbon
// ────────────────────────────────────────────────────────────────────────────
export const TRANSPORT_OPTIONS = [
  {
    id: 'train', emoji: '🚆', title: 'Train · ICE + TGV + Sud Express',
    tag: 'Greenest', pointsReward: 25,
    detail: 'Munich → Paris → Hendaye → Lisbon · 1 transfer + 1 overnight · Wi‑Fi · scenic Atlantic coast',
    duration: '32 h', price: '€142', co2: '78 kg', score: '96 / 100',
    tone: 'forest',
    why: '75% lower CO₂ than the cheapest flight on this route. Matches your "prefer train" preference. Eligible for your Green Commuter Week challenge.',
  },
  {
    id: 'bus', emoji: '🚌', title: 'Bus + Train · FlixBus + Renfe',
    tag: null, pointsReward: 20,
    detail: 'Cheapest sustainable combo · 2 transfers · night bus saves a hotel night',
    duration: '28 h', price: '€98', co2: '95 kg', score: '88 / 100',
    tone: 'moss',
  },
  {
    id: 'flight', emoji: '✈️', title: 'Flight · Lufthansa direct',
    tag: 'High CO₂', pointsReward: 0,
    detail: 'Fastest option · but emits 4× more CO₂ than train.',
    duration: '3 h 5 m', price: '€89', co2: '312 kg', score: '22 / 100',
    tone: 'rose',
    warning: 'Picking this flight will cost you ~234 kg extra CO₂ — equivalent to 2 months of an average German household\'s electricity use.',
  },
]

// Stay
export const STAY_OPTIONS = [
  { id: 's1', name: 'Memmo Alfama Hotel', cert: '🌿 GreenKey', district: 'Alfama · 100% renewable energy · solar water', price: '€186', score: 94, gradient: 'from-moss-300 to-forest-500' },
  { id: 's2', name: 'Inspira Liberdade Boutique', cert: '🌿 EU Ecolabel', district: 'Avenida · zero‑waste kitchen · grey water reuse', price: '€164', score: 91, gradient: 'from-forest-300 to-moss-500' },
  { id: 's3', name: 'Casa do Príncipe Real', cert: '🌿 Biosphere', district: 'Príncipe Real · local‑owned · plant‑based breakfast', price: '€132', score: 87, gradient: 'from-moss-200 to-forest-400' },
]

// Eat
export const EAT_OPTIONS = [
  { id: 'e1', emoji: '🥗', name: 'Ao 26 — Vegan Food Project', district: 'Chiado · 100% plant‑based · seasonal menu', tags: ['Local sourced', 'Low food‑miles'], price: '€€', score: 95 },
  { id: 'e2', emoji: '🐟', name: 'Sea Me — Peixaria Moderna', district: 'Chiado · MSC‑certified seafood · day‑boat catch', tags: ['MSC', 'Local fish'], price: '€€€', score: 82 },
  { id: 'e3', emoji: '🌱', name: 'Príncipe do Calhariz', district: 'Bairro Alto · vegetarian · family‑run since 1978', tags: ['Local owned', 'Vegetarian'], price: '€', score: 89 },
]

// Do
export const DO_OPTIONS = [
  { id: 'd1', name: 'Monsanto Forest Park hike', tag: 'Low‑crowd', pointsReward: 10, detail: 'Free · 3h · 9.2 km · public bus 711', crowd: 1, score: 98, gradient: 'from-moss-300 to-forest-500' },
  { id: 'd2', name: 'Museu Coleção Berardo', tag: 'Off‑peak · weekday', pointsReward: 7, detail: '€7 · indoor · accessible · Belém line tram 15E', crowd: 2, score: 86, gradient: 'from-forest-400 to-forest-700' },
  { id: 'd3', name: 'LX Factory by foot', tag: 'Hidden gem', pointsReward: 5, detail: 'Free · self‑guided · independent shops', crowd: 3, score: 82, gradient: 'from-moss-200 to-moss-500' },
  { id: 'd4', name: 'Belém Tower (queues 90 min)', tag: 'Crowded · peak', pointsReward: 1, detail: '€8 · consider weekday 9am or visit nearby instead', crowd: 5, score: 41, gradient: 'from-gold-200 to-gold-400', warning: true },
]

// Challenges
export const ACTIVE_CHALLENGE = {
  name: 'Green Commuter Week',
  description: "Don't take a taxi or ride‑share for 7 consecutive days. Use public transport, bike or your feet.",
  reward: 20, rewardBadge: 'No‑Taxi Ninja',
  progress: [true, true, true, 'today', false, false, false], // Mon..Sun
}
export const AVAILABLE_CHALLENGES = [
  { id: 'c1', emoji: '🌿', name: 'Plant‑Based Weekend', detail: '3 plant‑based meals across Sat & Sun.', reward: 30, joined: 312 },
  { id: 'c2', emoji: '🚆', name: 'Train Over Plane', detail: 'Book 1 train trip ≥500 km instead of a flight this month.', reward: 50, joined: 128 },
  { id: 'c3', emoji: '🏔️', name: 'Off‑Peak Explorer', detail: 'Travel to a low‑season destination (Mar / Oct / Nov).', reward: 40, joined: 94 },
  { id: 'c4', emoji: '♻️', name: 'Zero‑Waste Traveler', detail: 'Use a reusable bottle every day of your next trip.', reward: 15, joined: 501 },
  { id: 'c5', emoji: '🚲', name: 'Pedal Power 50k', detail: 'Cover 50 km by bike in one week (Strava connect).', reward: 25, joined: 214 },
  { id: 'c6', emoji: '🛏️', name: 'Stay Green', detail: 'Book 1 GreenKey / EU‑Ecolabel hotel this month.', reward: 20, joined: 187 },
]

// Leaderboard (Munich, this week)
export const LEADERBOARD = [
  { rank: 1, name: 'Sophie Albrecht', initials: 'SA', tier: 'Trail Legend', points: 3420, action: 'Cycled 84 km · 4 plant‑based meals', co2: '52 kg' },
  { rank: 2, name: 'Lukas Maier',     initials: 'LM', tier: 'Eco Pathfinder', points: 2990, action: 'Train Munich → Berlin', co2: '38 kg' },
  { rank: 3, name: 'Jana Kraus',      initials: 'JK', tier: 'Eco Explorer', points: 2776, action: 'GreenKey stay · 4 nights', co2: '24 kg' },
  { rank: 4, name: 'Felix Bauer',     initials: 'FB', points: 2602, action: 'Train Munich → Vienna', co2: '42 kg' },
  { rank: 5, name: 'Mira Singh',      initials: 'MS', points: 2488, action: 'Plant‑Based Weekend', co2: '31 kg' },
  { rank: 6, name: 'Anton Weber',     initials: 'AW', points: 2401, action: 'No‑Taxi 7‑day streak', co2: '28 kg' },
  { rank: 7, name: 'Elena Romano',    initials: 'ER', points: 2310, action: 'Cycled 64 km commute', co2: '22 kg' },
  { rank: 8, name: 'Henrik Olsen',    initials: 'HO', points: 2205, action: 'EU‑Ecolabel stay (3 nights)', co2: '18 kg' },
]

// Badges
export const BADGES = [
  { id: 'b1', emoji: '🏅', name: 'Low‑Carbon Pioneer', detail: '100 pts in eco‑transport', unlockedOn: '13 May', unlocked: true },
  { id: 'b2', emoji: '🌍', name: 'Off‑Peak Hero', detail: '3 off‑season trips', unlockedOn: '2 May', unlocked: true },
  { id: 'b3', emoji: '🚲', name: 'Bike Champ', detail: '200 km cycled', unlockedOn: '22 Apr', unlocked: true },
  { id: 'b4', emoji: '🚆', name: 'Rail Romantic', detail: '5 train trips ≥300 km', unlockedOn: '15 Apr', unlocked: true },
  { id: 'b5', emoji: '🌱', name: 'Plant Powered', detail: '20 plant‑based meals', unlockedOn: '7 Apr', unlocked: true },
  { id: 'b6', emoji: '🏨', name: 'Green Sleeper', detail: '5 GreenKey stays', unlockedOn: '28 Mar', unlocked: true },
  { id: 'b7', name: 'No‑Taxi Ninja', detail: 'Finish Green Commuter Week', unlocked: false, progress: 43, progressText: 'Day 3/7' },
  { id: 'b8', name: 'City Saver', detail: 'Avoid Venice, BCN & AMS in peak', unlocked: false },
  { id: 'b9', name: 'Slow Traveller', detail: 'Stay ≥4 nights in one place', unlocked: false },
  { id: 'b10', name: 'Hidden‑Gem Hunter', detail: '3 destinations off the top‑50 list', unlocked: false },
  { id: 'b11', name: 'Carbon Cutter', detail: 'Save 100 kg CO₂ in one month', unlocked: false },
  { id: 'b12', name: 'Community Voice', detail: 'Write 5 helpful eco‑reviews', unlocked: false },
]

export const RECENT_ACTIVITY = [
  { emoji: '🚆', title: 'Train booked', detail: 'Munich → Salzburg', meta: '12 min ago · −18 kg CO₂', pts: 8, bg: 'bg-forest-50' },
  { emoji: '🥗', title: 'Eco‑checkin', detail: 'at Tian (vegan)', meta: 'Yesterday', pts: 1, bg: 'bg-moss-50' },
  { emoji: '🏅', title: 'Badge unlocked', detail: 'Low‑Carbon Pioneer', meta: 'Mon 13:42', pts: 50, bg: 'bg-gold-50' },
  { emoji: '🏨', title: 'Stayed at', detail: 'Hotel Hubertus (GreenKey)', meta: 'Sun', pts: 5, bg: 'bg-forest-50' },
]
