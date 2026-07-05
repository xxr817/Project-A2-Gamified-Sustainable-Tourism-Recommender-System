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
    why: '75% lower CO₂ than the cheapest flight on this route. Matches your "prefer train" preference.',
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
  { id: 's1', name: 'Memmo Alfama Hotel', cert: '🌿 GreenKey', district: 'Alfama · 100% renewable energy · solar water', price: '€186', score: 94 },
  { id: 's2', name: 'Inspira Liberdade Boutique', cert: '🌿 EU Ecolabel', district: 'Avenida · zero-waste kitchen · grey water reuse', price: '€164', score: 91 },
  { id: 's3', name: 'Prince Royal House', cert: '🌿 Biosphere', district: 'Prince Royal · local-owned · plant-based breakfast', price: '€132', score: 87 },
  { id: 's4', name: 'NEYA Lisboa Hotel', cert: '🌿 GreenKey', district: 'Saldanha · energy-efficient rooms · waste sorting', price: '€148', score: 89 },
  { id: 's5', name: 'Sofitel Lisbon Liberdade', cert: '🌿 GreenKey', district: 'Avenida da Liberdade · certified sustainability programme', price: '€212', score: 88 },
  { id: 's6', name: 'Corpo Santo Lisbon Historical Hotel', cert: '🌿 EU Ecolabel', district: 'Cais do Sodre · refill amenities · heritage retrofit', price: '€198', score: 90 },
]

// Eat
export const EAT_OPTIONS = [
  { id: 'e1', emoji: '🥗', name: 'Ao 26 — Vegan Food Project', district: 'Chiado', tags: ['Vegan', 'Traditional'], price: '€€', score: 95, detail: 'Plant-based takes on Portuguese classics near Chiado.', restaurantPageUrl: 'https://www.ao26.pt/' },
  { id: 'e2', emoji: '🌱', name: 'Organi Chiado', district: 'Chiado', tags: ['Vegan', 'Sustainable'], price: '€€', score: 92, detail: 'Organic vegan bowls, mains and desserts in the centre.', restaurantPageUrl: 'https://www.organi.pt/' },
  { id: 'e3', emoji: '🥬', name: "My Mother's Daughters", district: 'Sao Bento', tags: ['Vegan', 'Organic'], price: '€€', score: 91, detail: 'Creative vegan brunch and seasonal plates.', restaurantPageUrl: 'https://www.mymothersdaughters.pt/' },
  { id: 'e4', emoji: '🍲', name: 'The Green Affair', district: 'Saldanha', tags: ['Vegan', 'Modern'], price: '€€', score: 88, detail: 'Modern vegan dining with burgers, bowls and Portuguese touches.', restaurantPageUrl: 'https://thegreenaffair.pt/' },
  { id: 'e5', emoji: '🥙', name: 'Cherry Garden', district: 'Baixa', tags: ['Vegetarian', 'Buffet'], price: '€', score: 85, detail: 'Affordable vegetarian buffet close to central transit.', restaurantPageUrl: 'https://www.happycow.net/reviews/jardim-das-cerejas-lisbon-6639' },
  { id: 'e6', emoji: '🍛', name: 'Legumi Sushi Vegan', district: 'Arroios', tags: ['Vegan', 'Local favourite'], price: '€€', score: 87, detail: 'Vegan sushi and plant-based small plates.', restaurantPageUrl: 'https://www.happycow.net/reviews/legumi-sushi-vegan-lisbon-327787' },
]

// Do
export const DO_OPTIONS = [
  { id: 'd1', name: 'Belem Tower', tag: 'Iconic · go early', pointsReward: 7, detail: '€8 · riverside landmark · tram 15E', crowd: 4, score: 84, gradient: 'from-moss-300 to-forest-500', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Lisbon_Torre_de_Bel%C3%A9m_BW_2018-10-03_16-33-21.jpg/960px-Lisbon_Torre_de_Bel%C3%A9m_BW_2018-10-03_16-33-21.jpg', imageAlt: 'Belem Tower in Lisbon', photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Lisbon_Torre_de_Bel%C3%A9m_BW_2018-10-03_16-33-21.jpg' },
  { id: 'd2', name: 'Jeronimos Monastery cloister', tag: 'Off-peak · weekday', pointsReward: 7, detail: '€12 · heritage site · combine with Belem walk', crowd: 3, score: 88, gradient: 'from-forest-400 to-forest-700', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Cloister_of_the_Jer%C3%B3nimos_Monastery_in_Bel%C3%A9m%2C_Lisbon%2C_20250604_1313_9204.jpg/960px-Cloister_of_the_Jer%C3%B3nimos_Monastery_in_Bel%C3%A9m%2C_Lisbon%2C_20250604_1313_9204.jpg', imageAlt: 'Jeronimos Monastery cloister', photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Cloister_of_the_Jer%C3%B3nimos_Monastery_in_Bel%C3%A9m,_Lisbon,_20250604_1313_9204.jpg' },
  { id: 'd3', name: 'Alfama by foot', tag: 'Low-crowd lanes', pointsReward: 8, detail: 'Free · self-guided · viewpoints and stairs', crowd: 2, score: 90, gradient: 'from-moss-200 to-moss-500', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Alfama-CCBY.jpg/960px-Alfama-CCBY.jpg', imageAlt: 'Alfama district in Lisbon', photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Alfama-CCBY.jpg' },
  { id: 'd4', name: 'Rua Augusta Arch', tag: 'Central · walkable', pointsReward: 5, detail: '€4.50 · city view · pair with riverside stroll', crowd: 3, score: 82, gradient: 'from-forest-300 to-moss-500', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Arco_Triunfal_da_Rua_Augusta%2C_Plaza_del_Comercio%2C_Lisboa%2C_Portugal%2C_2012-05-12%2C_DD_02.JPG/960px-Arco_Triunfal_da_Rua_Augusta%2C_Plaza_del_Comercio%2C_Lisboa%2C_Portugal%2C_2012-05-12%2C_DD_02.JPG', imageAlt: 'Rua Augusta Arch in Lisbon', photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Arco_Triunfal_da_Rua_Augusta,_Plaza_del_Comercio,_Lisboa,_Portugal,_2012-05-12,_DD_02.JPG' },
  { id: 'd5', name: 'Bica Funicular walk', tag: 'Transit heritage', pointsReward: 5, detail: '€4 · short ride or uphill walk · photo stop', crowd: 3, score: 80, gradient: 'from-moss-300 to-forest-600', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Ascensor_da_Bica_01.JPG/960px-Ascensor_da_Bica_01.JPG', imageAlt: 'Bica funicular in Lisbon', photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Ascensor_da_Bica_01.JPG' },
  { id: 'd6', name: 'Lisbon City Museum', tag: 'Indoor · quieter', pointsReward: 6, detail: 'Museum stop · good midday heat break', crowd: 2, score: 84, gradient: 'from-forest-400 to-moss-600', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Lisbon_City_Museum%2C_2006-01-04.jpg/960px-Lisbon_City_Museum%2C_2006-01-04.jpg', imageAlt: 'Lisbon City Museum', photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Lisbon_City_Museum,_2006-01-04.jpg' },
  { id: 'd7', name: 'MAAT riverfront', tag: 'Architecture · tram', pointsReward: 6, detail: '€11 · riverfront museum · Belem line', crowd: 2, score: 86, gradient: 'from-moss-200 to-forest-400', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Building_of_the_Museum_of_Art%2C_Architecture_and_Technology_in_Lisbon%2C_20250604_2006_9600.jpg/960px-Building_of_the_Museum_of_Art%2C_Architecture_and_Technology_in_Lisbon%2C_20250604_2006_9600.jpg', imageAlt: 'MAAT museum in Lisbon', photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Building_of_the_Museum_of_Art,_Architecture_and_Technology_in_Lisbon,_20250604_2006_9600.jpg' },
  { id: 'd8', name: 'Lisbon Oceanarium', tag: 'Family · metro', pointsReward: 4, detail: '€25 · Nations Park · metro access', crowd: 4, score: 78, gradient: 'from-forest-500 to-moss-400', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Gabriel_at_the_Tropical_Indian_at_Lisbon_Oceanarium%2C_Portugal_julesvernex2.jpg/960px-Gabriel_at_the_Tropical_Indian_at_Lisbon_Oceanarium%2C_Portugal_julesvernex2.jpg', imageAlt: 'Lisbon Oceanarium', photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Gabriel_at_the_Tropical_Indian_at_Lisbon_Oceanarium,_Portugal_julesvernex2.jpg' },
  { id: 'd9', name: 'Parque Eduardo VII', tag: 'Free · green space', pointsReward: 9, detail: 'Free · picnic-friendly · metro nearby', crowd: 1, score: 92, gradient: 'from-moss-300 to-forest-500', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/2025-08-22_Lisbon%2C_Parque_Eduardo_VII.jpg/960px-2025-08-22_Lisbon%2C_Parque_Eduardo_VII.jpg', imageAlt: 'Parque Eduardo VII in Lisbon', photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:2025-08-22_Lisbon,_Parque_Eduardo_VII.jpg' },
  { id: 'd10', name: 'Monsanto Forest Park hike', tag: 'Low-crowd', pointsReward: 10, detail: 'Free · 3h · 9.2 km · public bus 711', crowd: 1, score: 98, gradient: 'from-forest-400 to-forest-700', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/A_Lisbon_view.jpg/960px-A_Lisbon_view.jpg', imageAlt: 'Lisbon green city view', photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:A_Lisbon_view.jpg' },
  { id: 'd11', name: 'LX Factory by tram', tag: 'Local creative hub', pointsReward: 6, detail: 'Free entry · tram 15E · shops, murals and reused industrial spaces', crowd: 3, score: 84, gradient: 'from-moss-200 to-forest-400', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/LX_Factory_Lisbon_%2843450749470%29.jpg/960px-LX_Factory_Lisbon_%2843450749470%29.jpg', imageAlt: 'LX Factory in Lisbon', photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:LX_Factory_Lisbon_(43450749470).jpg' },
  { id: 'd12', name: 'Gulbenkian Garden pause', tag: 'Quiet · accessible', pointsReward: 7, detail: 'Free garden · museum nearby · metro access and shaded paths', crowd: 1, score: 91, gradient: 'from-forest-300 to-moss-500', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Gulbenkian_April_2009-2.jpg/960px-Gulbenkian_April_2009-2.jpg', imageAlt: 'Gulbenkian Garden in Lisbon', photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Gulbenkian_April_2009-2.jpg' },
]

export const AVAILABLE_CHALLENGES = [
  { id: 'c1', emoji: '🌿', name: 'Plant‑Based Meals', detail: 'Choose 3 plant-based meals during your trip.', reward: 30, joined: 312 },
  { id: 'c2', emoji: '🚆', name: 'Train Over Plane', detail: 'Book 1 train trip ≥500 km instead of a flight this month.', reward: 50, joined: 128 },
  { id: 'c3', emoji: '🏔️', name: 'Off‑Peak Explorer', detail: 'Travel to a low‑season destination (Mar / Oct / Nov).', reward: 40, joined: 94 },
  { id: 'c6', emoji: '🛏️', name: 'Stay Green', detail: 'Book 1 GreenKey / EU‑Ecolabel hotel this month.', reward: 20, joined: 187 },
]

// Leaderboard (Munich, this week)
export const LEADERBOARD = [
  { rank: 1, name: 'Sophie Albrecht', initials: 'SA', tier: 'Trail Legend', points: 3420, action: 'Cycled 84 km · 4 plant‑based meals', co2: '52 kg' },
  { rank: 2, name: 'Lukas Maier',     initials: 'LM', tier: 'Eco Pathfinder', points: 2990, action: 'Train Munich → Berlin', co2: '38 kg' },
  { rank: 3, name: 'Jana Kraus',      initials: 'JK', tier: 'Eco Explorer', points: 2776, action: 'GreenKey stay · 4 nights', co2: '24 kg' },
  { rank: 4, name: 'Felix Bauer',     initials: 'FB', points: 2602, action: 'Train Munich → Vienna', co2: '42 kg' },
  { rank: 5, name: 'Mira Singh',      initials: 'MS', points: 2488, action: 'Plant‑based meals', co2: '31 kg' },
  { rank: 6, name: 'Anton Weber',     initials: 'AW', points: 2401, action: 'Train Munich → Zurich', co2: '28 kg' },
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
  { id: 'b7', name: 'Transit Saver', detail: 'Choose low-carbon transport', unlocked: false, progress: 43, progressText: '3/7 actions' },
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
