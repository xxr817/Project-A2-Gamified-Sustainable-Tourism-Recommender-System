-- EcoTrail seed data
-- Sources: EEA 2023, Booking.com 2023, Lenzen 2018, Koivisto & Hamari 2019

------------------------------------------------------------
-- Transport modes (EEA 2023, g CO2 per passenger-km)
------------------------------------------------------------

insert into public.transport_modes (id, mode, emoji, co2_grams_per_km, relative_emission, tone) values
  ('walking',  'Walking',      '🚶', 0,   1,   'forest'),
  ('cycling',  'Cycling',      '🚲', 0,   1,   'forest'),
  ('train',    'Train',        '🚆', 35,  14,  'forest'),
  ('bus',      'Bus',          '🚌', 75,  30,  'moss'),
  ('car',      'Car (1 pax)',  '🚗', 170, 67,  'gold'),
  ('flight',   'Short flight', '✈️', 255, 100, 'rose');


------------------------------------------------------------
-- Destinations
------------------------------------------------------------

insert into public.destinations (id, name, country, tag, points_reward, green_score, nights, from_price, crowd_level, gradient, detail) values
  ('lisbon',
   'Lisbon, Portugal', 'Portugal',
   'Off-peak · June', 25, 92, 7, '€142 by train', 2,
   'from-moss-300 to-forest-500',
   'Lisbon is in shoulder season in June — 30% less crowded than July/Aug. Best reached by train via Paris–Hendaye–Lisbon (32 h). 7 nights, from €142 by train.'),
  ('bohinj',
   'Bohinj, Slovenia', 'Slovenia',
   'Hidden gem', 35, 96, 5, '€98 by train', 1,
   'from-forest-400 to-forest-700',
   'Bohinj Lake (Triglav NP) is a hidden gem — fewer visitors than Bled, 96/100 green-score. Train via Villach–Jesenice–Bohinjska Bistrica. 5 nights, from €98.'),
  ('porto',
   'Porto, Portugal', 'Portugal',
   'Slow travel', 22, 88, 6, '€128 by train', 3,
   'from-moss-200 to-moss-500',
   'Porto rewards slow travel: 6 nights of food, port wine cellars and Douro Valley day-trips. Direct night train from Hendaye after the Paris leg. From €128.');


------------------------------------------------------------
-- Transport options (Munich → Lisbon, demo route)
------------------------------------------------------------

insert into public.transport_options (id, destination_id, emoji, title, tag, points_reward, detail, duration, price, co2, co2_kg, green_score, tone, why) values
  ('mun-lis-train', 'lisbon', '🚆',
   'Train · ICE + TGV + Sud Express',
   'Greenest', 25,
   'Munich → Paris → Hendaye → Lisbon · 1 transfer + 1 overnight · Wi-Fi · scenic Atlantic coast',
   '32 h', '€142', '78 kg', 78, 96, 'forest',
   '75% lower CO₂ than the cheapest flight on this route. Matches your "prefer train" preference.'),
  ('mun-lis-bus', 'lisbon', '🚌',
   'Bus + Train · FlixBus + Renfe',
   null, 20,
   'Cheapest sustainable combo · 2 transfers · night bus saves a hotel night',
   '28 h', '€98', '95 kg', 95, 88, 'moss',
   null);

insert into public.transport_options (id, destination_id, emoji, title, tag, points_reward, detail, duration, price, co2, co2_kg, green_score, tone, warning) values
  ('mun-lis-flight', 'lisbon', '✈️',
   'Flight · Lufthansa direct',
   'High CO₂', 0,
   'Fastest option · but emits 4× more CO₂ than train.',
   '3 h 5 m', '€89', '312 kg', 312, 22, 'rose',
   'Picking this flight will cost you ~234 kg extra CO₂ — equivalent to 2 months of an average German household''s electricity use.');


------------------------------------------------------------
-- Stays
------------------------------------------------------------

insert into public.stays (id, destination_id, name, certification, district, price, green_score, gradient) values
  ('s1', 'lisbon', 'Memmo Alfama Hotel',         '🌿 GreenKey',   'Alfama · 100% renewable energy · solar water',     '€186', 94, 'from-moss-300 to-forest-500'),
  ('s2', 'lisbon', 'Inspira Liberdade Boutique', '🌿 EU Ecolabel', 'Avenida · zero-waste kitchen · grey water reuse', '€164', 91, 'from-forest-300 to-moss-500'),
  ('s3', 'lisbon', 'Casa do Príncipe Real',      '🌿 Biosphere',  'Príncipe Real · local-owned · plant-based breakfast', '€132', 87, 'from-moss-200 to-forest-400');


------------------------------------------------------------
-- Eats
------------------------------------------------------------

insert into public.eats (id, destination_id, emoji, name, district, tags, price_tier, green_score) values
  ('e1', 'lisbon', '🥗', 'Ao 26 — Vegan Food Project',  'Chiado · 100% plant-based · seasonal menu',           array['Local sourced','Low food-miles'], '€€',  95),
  ('e2', 'lisbon', '🐟', 'Sea Me — Peixaria Moderna',   'Chiado · MSC-certified seafood · day-boat catch',      array['MSC','Local fish'],                '€€€', 82),
  ('e3', 'lisbon', '🌱', 'Príncipe do Calhariz',        'Bairro Alto · vegetarian · family-run since 1978',     array['Local owned','Vegetarian'],        '€',   89);


------------------------------------------------------------
-- Activities
------------------------------------------------------------

insert into public.activities (id, destination_id, name, tag, points_reward, detail, crowd_level, green_score, gradient, warning) values
  ('d1', 'lisbon', 'Monsanto Forest Park hike',       'Low-crowd',         3, 'Free · 3h · 9.2 km · public bus 711',                 1, 98, 'from-moss-300 to-forest-500', false),
  ('d2', 'lisbon', 'Museu Coleção Berardo',           'Off-peak · weekday', 2, '€7 · indoor · accessible · Belém line tram 15E',     2, 86, 'from-forest-400 to-forest-700', false),
  ('d3', 'lisbon', 'LX Factory by foot',              'Hidden gem',         3, 'Free · self-guided · independent shops',              3, 82, 'from-moss-200 to-moss-500', false),
  ('d4', 'lisbon', 'Belém Tower (queues 90 min)',     'Crowded · peak',     0, '€8 · consider weekday 9am or visit nearby instead',  5, 41, 'from-gold-200 to-gold-400', true);


------------------------------------------------------------
-- Challenges
------------------------------------------------------------

insert into public.challenges (id, emoji, name, detail, reward, duration) values
  ('c1', '🌿', 'Plant-Based Meals',  'Choose 3 plant-based meals during your trip.',                     30, 'trip'),
  ('c2', '🚆', 'Train Over Plane',     'Book 1 train trip ≥500 km instead of a flight this month.',     50, 'monthly'),
  ('c3', '🏔️', 'Off-Peak Explorer',    'Travel to a low-season destination (Mar / Oct / Nov).',          40, 'monthly'),
  ('c6', '🛏️', 'Stay Green',          'Book 1 GreenKey / EU-Ecolabel hotel this month.',                20, 'monthly');


------------------------------------------------------------
-- Badges
------------------------------------------------------------

insert into public.badges (id, emoji, name, detail, unlock_criteria) values
  ('low-carbon-pioneer', '🏅', 'Low-Carbon Pioneer', '100 pts in eco-transport',          'Earn 100 points using train, bus, bike or walking.'),
  ('off-peak-hero',      '🌍', 'Off-Peak Hero',      '3 off-season trips',                 'Complete 3 trips outside Jun–Aug peak.'),
  ('bike-champ',         '🚲', 'Bike Champ',         '200 km cycled',                      'Log 200 km on a bike via Strava connect.'),
  ('rail-romantic',      '🚆', 'Rail Romantic',      '5 train trips ≥300 km',              'Book 5 train trips of 300 km or more.'),
  ('plant-powered',      '🌱', 'Plant Powered',      '20 plant-based meals',               'Eco-checkin at 20 plant-based meals.'),
  ('green-sleeper',      '🏨', 'Green Sleeper',      '5 GreenKey stays',                   'Stay 5 nights at GreenKey or EU-Ecolabel hotels.'),
  ('city-saver',          null, 'City Saver',        'Avoid Venice, BCN & AMS in peak',    'Travel to 3 less-visited cities instead of overtouristed peaks.'),
  ('slow-traveller',      null, 'Slow Traveller',    'Stay ≥4 nights in one place',        'Take a trip with at least 4 consecutive nights at one stay.'),
  ('hidden-gem-hunter',   null, 'Hidden-Gem Hunter', '3 destinations off the top-50 list', 'Book 3 destinations outside the EU top-50 most visited.'),
  ('carbon-cutter',       null, 'Carbon Cutter',     'Save 100 kg CO₂ in one month',       'Accumulate 100 kg CO₂ savings in a single month.'),
  ('community-voice',     null, 'Community Voice',   'Write 5 helpful eco-reviews',        'Write 5 helpful eco-reviews on stays or activities.');
