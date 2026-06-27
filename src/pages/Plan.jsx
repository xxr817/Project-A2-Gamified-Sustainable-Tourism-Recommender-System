import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Tabs, CrowdBar, useToast } from '../ui.jsx'
import { useUser } from '../App.jsx'
import { TRANSPORT_OPTIONS, STAY_OPTIONS, DO_OPTIONS } from '../data.js'
import { useAuth } from '../AuthContext.jsx'
import { supabase } from '../supabase'

// Base URL of the FastAPI backend. Empty string ('') keeps the Vite dev-proxy
// behaviour locally (/api -> 127.0.0.1:8000). In production set
// VITE_API_BASE_URL to the deployed backend, e.g. https://ecotrail-api.onrender.com
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const TABS = [
  { id: 'transport', label: '🚆 Transport' },
  { id: 'stay',      label: '🏨 Stay' },
  { id: 'do',        label: '🎯 Do' },
]

export default function Plan() {
  const showToast = useToast()
  const [tab, setTab] = useState('transport')
  const [fromCity, setFromCity] = useState('Munich, Germany')
  const [toCity, setToCity] = useState('Lisbon, Portugal')
  const [departDate, setDepartDate] = useState(() => new Date(2026, 5, 15))
  const [returnDate, setReturnDate] = useState(() => new Date(2026, 5, 22))
  const [selectedTransport, setSelectedTransport] = useState(null)
  const [generatedPlan, setGeneratedPlan] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const transportOptions = generatedPlan?.transport?.length ? generatedPlan.transport : TRANSPORT_OPTIONS
  const activityOptions = generatedPlan?.activities?.length ? generatedPlan.activities : DO_OPTIONS
  const stayOptions = generatedPlan?.stays?.length ? generatedPlan.stays : STAY_OPTIONS

  const handleSearch = async () => {
    setSearchLoading(true)
    setSearchError('')

    try {
      const response = await fetch(`${API_BASE}/api/plan-trip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_city: fromCity,
          to_city: toCity,
          depart_date: formatDateForDb(departDate),
          return_date: formatDateForDb(returnDate),
        }),
      })

      if (!response.ok) {
        throw new Error(`Search failed (${response.status})`)
      }

      const data = await response.json()
      setGeneratedPlan(normalizeGeneratedPlan(data))
      setSelectedTransport(null)
      setTab('transport')
      showToast('Search results updated.', 'forest')
    } catch (error) {
      const message = error?.message || 'Search failed. Start the backend API and try again.'
      setSearchError(message)
      showToast(message, 'forest')
    } finally {
      setSearchLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <SearchPanel
        fromCity={fromCity}
        toCity={toCity}
        departDate={departDate}
        returnDate={returnDate}
        onFromCityChange={setFromCity}
        onToCityChange={setToCity}
        onDepartDateChange={setDepartDate}
        onReturnDateChange={setReturnDate}
        onSearch={handleSearch}
        searchLoading={searchLoading}
        error={searchError}
        summary={generatedPlan?.summary}
        source={generatedPlan?.source}
        notice={generatedPlan?.notice}
      />
      <div className="rounded-3xl bg-white border border-forest-100 shadow-card">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
        {tab === 'transport' && (
          <TransportPanel
            fromCity={fromCity}
            toCity={toCity}
            departDate={departDate}
            returnDate={returnDate}
            transportOptions={transportOptions}
            searchSource={generatedPlan?.source}
            selectedTransport={selectedTransport}
            onTransportSelect={setSelectedTransport}
          />
        )}
        {tab === 'stay'      && <StayPanel stays={stayOptions} />}
        {tab === 'do'        && <DoPanel activities={activityOptions} />}
      </div>
    </div>
  )
}

function normalizeGeneratedPlan(data) {
  const transport = Array.isArray(data?.transport)
    ? data.transport.map((item, index) => ({
        id: item.id || `search-transport-${index}`,
        emoji: item.emoji || '🚆',
        title: item.title || 'Suggested route',
        tag: item.tag || null,
        pointsReward: Number(item.pointsReward ?? 0),
        detail: item.detail || 'Generated route option',
        duration: item.duration || 'TBD',
        co2: item.co2 || '0 kg',
        score: item.score || '80 / 100',
        tone: ['forest', 'moss', 'rose'].includes(item.tone) ? item.tone : 'forest',
        why: item.why || '',
        warning: item.warning || '',
        co2SavedKg: Number(item.co2SavedKg ?? 0),
        routeStops: Array.isArray(item.routeStops) ? item.routeStops.filter(Boolean) : [],
        generated: true,
      }))
    : []

  const activities = Array.isArray(data?.activities)
    ? data.activities.map((item, index) => ({
        id: item.id || `search-activity-${index}`,
        name: item.name || 'Suggested activity',
        tag: item.tag || 'Eco pick',
        pointsReward: Number(item.pointsReward ?? 1),
        detail: item.detail || 'Generated local activity',
        crowd: Number(item.crowd ?? 2),
        score: Number(item.score ?? 80),
        gradient: item.gradient || 'from-moss-300 to-forest-500',
        warning: Boolean(item.warning),
      }))
    : []

  const stays = Array.isArray(data?.stays)
    ? data.stays.map((item, index) => ({
        id: item.id || `search-stay-${index}`,
        name: item.name || 'Suggested eco stay',
        cert: item.cert || '🌿 Eco-certified',
        district: item.district || '',
        price: item.price || '',
        score: Number(item.score ?? 85),
      }))
    : []

  return {
    source: data?.source || 'search',
    notice: data?.notice || '',
    summary: data?.summary || '',
    transport,
    activities,
    stays,
  }
}

function SearchPanel({
  fromCity,
  toCity,
  departDate,
  returnDate,
  onFromCityChange,
  onToCityChange,
  onDepartDateChange,
  onReturnDateChange,
  onSearch,
  searchLoading,
  error,
  summary,
  source,
  notice,
}) {
  const [openDateField, setOpenDateField] = useState(null)
  const { authUser, loading: authLoading } = useAuth()

  return (
    <div className="rounded-3xl bg-white border border-forest-100 p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold">Plan a green trip</h2>
        </div>
        {!authLoading && !authUser && (
          <span className="text-xs font-semibold text-gold-600 bg-gold-50 border border-gold-100 rounded-full px-3 py-1">
            Sign in required to save history
          </span>
        )}
      </div>
      <div className="mt-5 grid grid-cols-12 gap-3">
        <Field
          className="col-span-12 md:col-span-6 xl:col-span-3"
          label="From"
          value={fromCity}
          onChange={onFromCityChange}
          citySearch
        />
        <Field
          className="col-span-12 md:col-span-6 xl:col-span-3"
          label="To"
          value={toCity}
          onChange={onToCityChange}
          citySearch
        />
        <DateField
          className="col-span-6 xl:col-span-2"
          label="Depart"
          value={departDate}
          open={openDateField === 'depart'}
          selectedStart={departDate}
          selectedEnd={returnDate}
          onToggle={() => setOpenDateField(openDateField === 'depart' ? null : 'depart')}
          onSelect={(date) => {
            onDepartDateChange(date)
            setOpenDateField(null)
          }}
        />
        <DateField
          className="col-span-6 xl:col-span-2"
          label="Return"
          value={returnDate}
          open={openDateField === 'return'}
          selectedStart={departDate}
          selectedEnd={returnDate}
          onToggle={() => setOpenDateField(openDateField === 'return' ? null : 'return')}
          onSelect={(date) => {
            onReturnDateChange(date)
            setOpenDateField(null)
          }}
        />
        <div className="col-span-12 md:col-span-6 xl:col-span-2 flex items-end">
          <button
            type="button"
            disabled={searchLoading}
            onClick={onSearch}
            className={`w-full py-2.5 rounded-xl text-white font-semibold ${
              searchLoading ? 'bg-forest-300 cursor-wait' : 'gradient-forest'
            }`}
          >
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      {(summary || error) && (
        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
          error
            ? 'border-red-100 bg-red-50 text-red-700'
            : 'border-forest-100 bg-forest-50 text-inkSoft'
        }`}>
          {error || summary}
          {!error && source && (
            <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-forest-600">
              {source}
            </span>
          )}
          {!error && notice && (
            <div className="mt-2 text-xs text-gold-700">
              {notice}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const YEAR_OPTIONS = Array.from({ length: 8 }, (_, index) => 2024 + index)

function DateField({ label, value, open, selectedStart, selectedEnd, onToggle, onSelect, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <label className="text-xs font-semibold text-inkSoft">{label}</label>
      <button
        type="button"
        onClick={onToggle}
        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-forest-100 outline-none focus:border-forest-500 bg-white text-left whitespace-nowrap"
      >
        {formatTripDate(value)}
      </button>
      {open && (
        <CalendarPicker
          value={value}
          selectedStart={selectedStart}
          selectedEnd={selectedEnd}
          onSelect={onSelect}
        />
      )}
    </div>
  )
}

function CalendarPicker({ value, selectedStart, selectedEnd, onSelect }) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1))
  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const days = Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1))

  const showMonth = (nextYear, nextMonth) => {
    setVisibleMonth(new Date(Number(nextYear), Number(nextMonth), 1))
  }

  return (
    <div className="absolute right-0 top-full z-30 mt-2 w-[min(360px,calc(100vw-2rem))] rounded-2xl bg-[#343638] text-[#F0F2F5] shadow-cardHover border border-white/10 p-6">
      <div className="mb-7 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => showMonth(year, month - 1)}
          className="grid h-9 w-9 place-items-center rounded-full text-[#DCE0E5] hover:bg-white/10"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center justify-center gap-2">
          <select
            value={month}
            onChange={(event) => showMonth(year, event.target.value)}
            className="rounded-lg bg-white/10 px-2 py-1 text-2xl font-semibold outline-none"
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index}>{index + 1}月</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(event) => showMonth(event.target.value, month)}
            className="rounded-lg bg-white/10 px-2 py-1 text-2xl font-semibold outline-none"
          >
            {YEAR_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => showMonth(year, month + 1)}
          className="grid h-9 w-9 place-items-center rounded-full text-[#DCE0E5] hover:bg-white/10"
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-5 text-center">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-xl text-[#DCE0E5]">{day}</div>
        ))}
        {Array.from({ length: firstWeekday }).map((_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {days.map((date) => {
          const selected = isSameDate(date, selectedStart) || isSameDate(date, selectedEnd)
          const inRange = date > selectedStart && date < selectedEnd

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelect(date)}
              className={`mx-auto grid h-10 w-10 place-items-center rounded-full text-2xl transition ${
                selected
                  ? 'bg-[#F0F2F5] text-[#343638]'
                  : inRange
                  ? 'bg-white/10 text-[#F0F2F5]'
                  : 'text-[#AEB4BA] hover:bg-white/10 hover:text-[#F0F2F5]'
              }`}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function isSameDate(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatTripDate(date) {
  return `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}

function Field({ label, defaultValue, value, onChange, citySearch = false, className = '' }) {
  const [focused, setFocused] = useState(false)
  const [matches, setMatches] = useState([])
  const [loadingCities, setLoadingCities] = useState(false)
  const query = String(value ?? defaultValue ?? '').trim().toLowerCase()
  const showSuggestions = focused && citySearch && (matches.length > 0 || loadingCities)

  useEffect(() => {
    if (!citySearch || query.length < 2) {
      setMatches([])
      setLoadingCities(false)
      return undefined
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoadingCities(true)

      try {
        const response = await fetch(`${API_BASE}/api/city-search?q=${encodeURIComponent(query)}&limit=6`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('City search failed')
        }

        const data = await response.json()
        setMatches(Array.isArray(data?.cities) ? data.cities : [])
      } catch (error) {
        if (error.name !== 'AbortError') {
          setMatches([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCities(false)
        }
      }
    }, 180)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [citySearch, query])

  return (
    <div className={`relative ${className}`}>
      <label className="text-xs font-semibold text-inkSoft">{label}</label>
      <input
        defaultValue={defaultValue}
        value={value}
        autoComplete="off"
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        onChange={(event) => onChange?.(event.target.value)}
        className="mt-1 w-full px-3 py-2.5 rounded-xl border border-forest-100 outline-none focus:border-forest-500"
      />
      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#343638] text-[#F0F2F5] shadow-cardHover">
          {loadingCities && matches.length === 0 && (
            <div className="px-4 py-3 text-sm text-[#B8BEC5]">Searching cities...</div>
          )}
          {matches.map((city) => (
            <button
              key={city.name}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange?.(city.name)
                setFocused(false)
              }}
              className="flex w-full items-start gap-3 border-b border-white/10 px-4 py-3 text-left last:border-b-0 hover:bg-white/10"
            >
              <span className="mt-0.5 text-lg">⌖</span>
              <span>
                <span className="block font-semibold">{city.name}</span>
                <span className="block text-xs text-[#B8BEC5]">{city.subtitle}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── TRANSPORT ─────────────────────────────────────────────────────── */
function TransportPanel({ fromCity, toCity, departDate, returnDate, transportOptions, searchSource, selectedTransport, onTransportSelect }) {
  const showToast = useToast()
  const { addPoints } = useUser()
  const { authUser, loading, refreshProfile } = useAuth()

  const saveTrip = async (transport, co2SavedKg) => {
    if (!authUser) return { saved: false, reason: 'not-authenticated' }

    const { error } = await supabase.from('trips').insert({
      user_id: authUser.id,
      start_date: formatDateForDb(departDate),
      end_date: formatDateForDb(returnDate),
      status: 'planned',
      co2_total_kg: parseCo2Kg(transport.co2),
      points_earned: transport.pointsReward,
    })

    if (error) {
      console.error('save trip error:', error.message)
      return { saved: false, reason: 'trip-error', error }
    }

    const { data: latestProfile, error: profileReadError } = await supabase
      .from('profiles')
      .select('trips_count, co2_saved_month_kg, co2_saved_total_kg')
      .eq('id', authUser.id)
      .single()

    if (profileReadError) {
      console.error('read profile for co2 error:', profileReadError.message)
      return { saved: true, profileSaved: false, reason: 'profile-read-error', error: profileReadError }
    }

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        trips_count: (latestProfile?.trips_count ?? 0) + 1,
        co2_saved_month_kg: roundCo2((latestProfile?.co2_saved_month_kg ?? 0) + co2SavedKg),
        co2_saved_total_kg: roundCo2((latestProfile?.co2_saved_total_kg ?? 0) + co2SavedKg),
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.id)

    if (profileUpdateError) {
      console.error('save co2 profile error:', profileUpdateError.message)
      return { saved: true, profileSaved: false, reason: 'profile-update-error', error: profileUpdateError }
    }

    await refreshProfile()
    return { saved: true, profileSaved: true }
  }

  return (
    <div className="p-6 grid grid-cols-12 gap-6">
      <div className="col-span-12 space-y-4">
        {transportOptions.map((opt) => (
          <TransportCard
            key={opt.id}
            opt={opt}
            searchSource={searchSource}
            selected={selectedTransport === opt.id}
            disabled={selectedTransport !== null}
            onSelect={async () => {
              if (loading) {
                showToast('Still loading your account. Try again in a moment.', 'forest')
                return
              }
              if (!authUser) {
                showToast('Please sign in first to save trip history and CO₂.', 'forest')
                return
              }
              if (selectedTransport !== null) return
              const co2SavedKg = calculateCo2SavedKg(opt, transportOptions)
              const result = await addPoints(opt.pointsReward, {
                type: 'transport',
                emoji: opt.emoji,
                title: 'Transport selected',
                detail: `${fromCity} → ${toCity} · ${opt.title}`,
                tone: opt.tone === 'forest' ? 'forest' : opt.tone === 'moss' ? 'moss' : 'gold',
                co2SavedKg,
              })
              const tripResult = await saveTrip(opt, co2SavedKg)
              if (result?.saved !== false && tripResult?.saved !== false && tripResult?.profileSaved !== false) {
                onTransportSelect(opt.id)
              }
              showToast(
                result?.saved === false || tripResult?.saved === false || tripResult?.profileSaved === false
                  ? `${opt.title} selected, but backend save failed: ${tripResult?.error?.message || result?.error?.message || tripResult?.reason || result?.reason || 'check login'}`
                  : `${opt.title} selected! Saved ${co2SavedKg} kg CO₂. +${opt.pointsReward} pts`,
                result?.saved === false || tripResult?.saved === false || tripResult?.profileSaved === false ? 'forest' : 'gold'
              )
              const ach = result?.achievements
              if (ach?.newBadges?.length) {
                showToast(`🏅 New badge unlocked! See your Badges page.`, 'gold')
              }
              ;(ach?.completedChallenges || []).forEach((c) =>
                showToast(`Challenge complete: ${c.name} · +${c.reward} pts 🏆`, 'gold'))
            }}
          />
        ))}
      </div>

    </div>
  )
}

function formatDateForDb(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseCo2Kg(value) {
  const parsed = Number(String(value).replace(/[^\d.]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function calculateCo2SavedKg(transport, options = TRANSPORT_OPTIONS) {
  if (Number.isFinite(transport.co2SavedKg)) {
    return roundCo2(Math.max(0, transport.co2SavedKg))
  }

  const flight = options.find((item) => item.id === 'flight' || item.tone === 'rose') || TRANSPORT_OPTIONS.find((item) => item.id === 'flight')
  const baselineCo2 = parseCo2Kg(flight?.co2)
  const selectedCo2 = parseCo2Kg(transport.co2)

  if (baselineCo2 === null || selectedCo2 === null) return 0
  return roundCo2(Math.max(0, baselineCo2 - selectedCo2))
}

function roundCo2(value) {
  return Math.round(value * 10) / 10
}



function TransportCard({ opt, searchSource, selected, disabled, onSelect }) {
  const tagStyle = opt.tone === 'rose'
    ? { background: '#FEE2E2', color: '#B91C1C' }
    : null
  const bg = opt.tone === 'forest' ? 'bg-forest-50'
           : opt.tone === 'moss'   ? 'bg-moss-50'
           : { background: '#FEE2E2' }

  return (
    <div className={`rounded-2xl border p-5 transition ${
      selected
        ? 'border-forest-400 shadow-card bg-forest-50/60'
        : 'border-forest-100 hover:shadow-cardHover'
    }`}>
      <div className="flex items-start gap-4">
        <div
          className={`w-14 h-14 rounded-2xl grid place-items-center text-2xl ${typeof bg === 'string' ? bg : ''}`}
          style={typeof bg === 'object' ? bg : undefined}
        >
          {opt.emoji}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-bold text-lg">{opt.title}</span>
            {opt.generated && (
              <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100">
                AI route{searchSource ? ` · ${searchSource}` : ''}
              </span>
            )}
            {opt.tag && (
              <span
                className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                  opt.tone === 'forest' ? 'text-forest-700 bg-forest-50 border border-forest-100' : ''
                }`}
                style={tagStyle || undefined}
              >
                {opt.tag}
              </span>
            )}
            <span
              className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                opt.pointsReward > 0
                  ? 'text-gold-500 bg-gold-50 border border-gold-100'
                  : 'text-mute bg-cream border border-forest-100'
              }`}
            >
              +{opt.pointsReward} pts
            </span>
          </div>
          <div className="text-sm text-inkSoft mt-1">{opt.detail}</div>
          {opt.routeStops?.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {opt.routeStops.map((stop, index) => (
                <React.Fragment key={`${opt.id}-${stop}-${index}`}>
                  <span className="rounded-full border border-forest-100 bg-white px-2 py-1 font-semibold text-inkSoft">
                    {stop}
                  </span>
                  {index < opt.routeStops.length - 1 && (
                    <span className="text-forest-500">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Field2 label="Duration"   value={opt.duration} />
            <Field2 label="CO₂"        value={opt.co2}   valueClass={opt.tone === 'forest' ? 'text-forest-700' : opt.tone === 'moss' ? 'text-moss-700' : opt.tone === 'rose' ? '' : ''} valueStyle={opt.tone === 'rose' ? { color: '#B91C1C' } : null} />
          </div>
        </div>
        <button
          onClick={onSelect}
          disabled={disabled}
          className={
            selected
              ? 'px-4 py-2 rounded-xl bg-forest-600 text-white text-sm font-semibold cursor-default'
              : disabled
              ? 'px-4 py-2 rounded-xl border border-forest-100 text-mute text-sm bg-cream cursor-not-allowed'
              : opt.tone === 'forest'
              ? 'px-4 py-2 rounded-xl gradient-forest text-white text-sm font-semibold'
              : opt.tone === 'rose'
              ? 'px-4 py-2 rounded-xl border border-forest-100 text-inkSoft text-sm hover:bg-forest-50'
              : 'px-4 py-2 rounded-xl bg-white border border-forest-200 text-forest-700 text-sm font-semibold'
          }
        >
          {selected ? 'Selected' : disabled ? 'Locked' : opt.tone === 'rose' ? 'Select anyway' : opt.tone === 'forest' ? 'Select →' : 'Select'}
        </button>
      </div>
      {opt.why && (
        <div className="mt-4 text-[12px] text-inkSoft bg-cream rounded-xl p-3 border border-forest-100">
          <strong className="text-forest-700">Why we recommend this:</strong> {opt.why}
        </div>
      )}
      {opt.warning && (
        <div className="mt-4 text-[12px] rounded-xl p-3 border bg-gold-50 border-gold-100 text-gold-700">
          <strong>Heads‑up:</strong> {opt.warning}
        </div>
      )}
    </div>
  )
}

function Field2({ label, value, valueClass = '', valueStyle }) {
  return (
    <div>
      <div className="text-xs text-mute">{label}</div>
      <div className={`font-display font-bold ${valueClass}`} style={valueStyle || undefined}>{value}</div>
    </div>
  )
}

/* ─── STAY ──────────────────────────────────────────────────────────── */
const STAY_GRADIENTS = ['from-moss-300 to-forest-500', 'from-forest-300 to-moss-500', 'from-moss-200 to-forest-400']

function StayPanel({ stays = STAY_OPTIONS }) {
  const showToast = useToast()
  const { addPoints } = useUser()
  const [selectedStay, setSelectedStay] = useState(null)

  return (
    <>
      <div className="p-6 grid grid-cols-3 gap-5">
        {stays.map((s, i) => {
          const selected = selectedStay === s.id
          const disabled = selectedStay !== null

          return (
            <div
              key={s.id}
              className={`rounded-2xl border overflow-hidden transition ${
                selected
                  ? 'border-forest-400 shadow-card bg-forest-50/60'
                  : 'border-forest-100 hover:shadow-cardHover'
              }`}
            >
              <div className={`h-40 bg-gradient-to-br ${s.gradient || STAY_GRADIENTS[i % STAY_GRADIENTS.length]} relative`}>
                <span className="absolute top-3 left-3 text-[11px] font-semibold bg-white/90 text-forest-700 rounded-full px-2 py-0.5">
                  {s.cert}
                </span>
                <span className="absolute top-3 right-3 text-[11px] font-semibold bg-gold-50 text-gold-500 rounded-full px-2 py-0.5">
                  +5 pts/night
                </span>
              </div>
              <div className="p-4">
                <div className="font-display font-bold">{s.name}</div>
                <div className="text-xs text-inkSoft">{s.district}</div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-bold">{s.price}<span className="text-mute font-normal">/night</span></span>
                  <span className="text-xs font-semibold text-forest-700">Green‑score {s.score}</span>
                </div>
                <button
                  disabled={disabled}
                  onClick={async () => {
                    if (selectedStay !== null) return
                    setSelectedStay(s.id)
                    const result = await addPoints(5, {
                      type: 'stay',
                      emoji: '🏨',
                      title: 'Stay selected',
                      detail: s.name,
                      tone: 'forest',
                    })
                    showToast(
                      result?.saved === false
                        ? `${s.name} selected, but backend history was not saved.`
                        : `${s.name} selected! +5 pts`,
                      result?.saved === false ? 'forest' : 'gold'
                    )
                  }}
                  className={
                    selected
                      ? 'mt-3 w-full py-2 rounded-xl bg-forest-600 text-white text-sm font-semibold cursor-default'
                      : disabled
                      ? 'mt-3 w-full py-2 rounded-xl border border-forest-100 text-mute text-sm bg-cream cursor-not-allowed'
                      : 'mt-3 w-full py-2 rounded-xl gradient-forest text-white text-sm font-semibold'
                  }
                >
                  {selected ? 'Selected' : disabled ? 'Locked' : 'Select'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <div className="px-6 pb-6 text-[12px] text-mute">
        Certifications cross‑checked against GreenKey, EU Ecolabel and Biosphere Tourism public registries.
      </div>
    </>
  )
}

/* ─── EAT ───────────────────────────────────────────────────────────── */
// Restaurant (Eat) recommendations were removed per final design.
// The backend may still return an `eats` array, but the UI no longer renders it.

/* ─── DO ────────────────────────────────────────────────────────────── */
function DoPanel({ activities = DO_OPTIONS }) {
  const showToast = useToast()
  const { addPoints } = useUser()
  const [selectedActivities, setSelectedActivities] = useState([])

  const selectActivity = async (activity) => {
    if (selectedActivities.includes(activity.id)) return

    setSelectedActivities((current) => [...current, activity.id])

    if (activity.pointsReward > 0) {
      const result = await addPoints(activity.pointsReward, {
        type: 'activity',
        emoji: '🎯',
        title: 'Activity selected',
        detail: activity.name,
        tone: activity.warning ? 'gold' : 'forest',
      })
      showToast(
        result?.saved === false
          ? `${activity.name} selected, but backend history was not saved.`
          : `${activity.name} selected! +${activity.pointsReward} pts`,
        result?.saved === false ? 'forest' : 'gold'
      )
    } else {
      const result = await addPoints(0, {
        type: 'activity',
        emoji: '🎯',
        title: 'Activity selected',
        detail: activity.name,
        tone: activity.warning ? 'gold' : 'forest',
      })
      showToast(
        result?.saved === false
          ? `${activity.name} selected, but backend history was not saved.`
          : `${activity.name} selected`,
        'forest'
      )
    }
  }

  return (
    <div className="p-6 grid grid-cols-12 gap-6">
      <div className="col-span-8 grid grid-cols-2 gap-5">
        {activities.map((d) => {
          const selected = selectedActivities.includes(d.id)

          return (
            <div
              key={d.id}
              className={`rounded-2xl border overflow-hidden transition ${
                selected
                  ? 'border-forest-400 shadow-card bg-forest-50/60'
                  : 'border-forest-100 hover:shadow-cardHover'
              }`}
            >
              <div className={`h-32 bg-gradient-to-br ${d.gradient} relative`}>
                <span
                  className="absolute top-3 left-3 text-[11px] font-semibold rounded-full px-2 py-0.5"
                  style={d.warning ? { background: '#FEE2E2', color: '#B91C1C' } : { background: 'rgba(255,255,255,.9)', color: '#234B25' }}
                >
                  {d.tag}
                </span>
                <span className={`absolute top-3 right-3 text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                  d.pointsReward > 0 ? 'bg-gold-50 text-gold-500' : 'bg-white/80 text-mute'
                }`}>
                  +{d.pointsReward} pts
                </span>
              </div>
              <div className="p-4">
                <div className="font-display font-bold">{d.name}</div>
                <div className="text-xs text-inkSoft">{d.detail}</div>
                <button
                  disabled={selected}
                  onClick={() => selectActivity(d)}
                  className={
                    selected
                      ? 'mt-3 w-full py-2 rounded-xl bg-forest-600 text-white text-sm font-semibold cursor-default'
                      : 'mt-3 w-full py-2 rounded-xl gradient-forest text-white text-sm font-semibold'
                  }
                >
                  {selected ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <aside className="col-span-4 rounded-2xl border border-forest-100 p-5 bg-cream/40">
        <div className="font-display font-bold">Map preview</div>
        <div className="map-tile h-72 rounded-xl mt-3 relative border border-forest-100">
          <span className="absolute" style={{ left: '18%', top: '24%' }}>📍</span>
          <span className="absolute" style={{ left: '42%', top: '50%' }}>📍</span>
          <span className="absolute" style={{ left: '62%', top: '34%' }}>📍</span>
          <span className="absolute" style={{ left: '28%', top: '72%' }}>📍</span>
        </div>
        <div className="text-[11px] text-mute mt-2">
          Activities clustered to minimise public‑transport hops. Source: OpenStreetMap.
        </div>
      </aside>
    </div>
  )
}
