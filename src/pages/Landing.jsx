import React from 'react'
import { Link } from 'react-router-dom'
import { Logo, Dot } from '../ui.jsx'
import { Sparkles, List, Users } from 'lucide-react'
import bgImage from '../assets/wallhaven-4813pj.jpg'

export default function Landing() {
  return (
      <div
          className="min-h-screen bg-cover bg-center bg-no-repeat"
          style={{
              backgroundImage: `url(${bgImage})`,
          }}
      >
          <header className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <Logo variant="light"/>
                  <span
                      className="ml-2 text-[11px] uppercase tracking-wider text-mute bg-white/70 border border-forest-100 rounded-full px-2 py-0.5">
            Project A2: Gamification in Sustainable TRS
          </span>
              </div>
              <nav className="hidden md:flex items-center gap-6 text-sm text-inkSoft">
                  <Link to="/login"
                        className="px-4 py-2 rounded-full bg-forest-600 text-white text-sm font-medium hover:bg-forest-700">
                      Sign in
                  </Link>
              </nav>
          </header>

          <div className="max-w-7xl mx-auto px-8 pt-10 pb-16 grid grid-cols-12 gap-8">
              <div className="col-span-7">
                  <div
                      className="inline-flex items-center gap-2 text-xs font-medium text-forest-700 bg-forest-50 border border-forest-100 rounded-full px-3 py-1">
                      <Dot/> Aligned with UN SDG 11 & 13
                  </div>
                  <h1 className="font-display font-extrabold text-5xl md:text-6xl leading-[1.05] mt-5 text-ink">
                      Travel light.<br/>
                      <span className="text-forest-600">Score points.</span><br/>
                      Save the planet.
                  </h1>
                  <p className="mt-5 text-white text-lg max-w-xl">
                      EcoTrail recommends greener transport, certified hotels, local food and off‑peak places — and
                      rewards every sustainable choice with points, badges and weekly challenges.
                  </p>
                  <div className="mt-10 grid grid-cols-4 gap-4 max-w-2xl">
                      <Stat big="8%" small="of global CO₂ comes from tourism" cite="Lenzen et al., 2018"/>
                      <Stat big="78%" small="want to travel sustainably" cite="Booking.com, 2023"/>
                      <Stat big="30%" small="actually do — intention–action gap" cite="Booking.com, 2023"/>
                      <Stat big="+25–40%" small="behaviour change with gamification" cite="Koivisto & Hamari, 2019"
                            gold/>
                  </div>
              </div>

              <DeviceMock/>
          </div>

          <div className="max-w-7xl mx-auto px-8 pb-20 grid grid-cols-3 gap-6">
              <Pillar Icon={List} bg="bg-forest-50" color="text-forest-700"
                      title="Recommends greener options"
                      text="Transport, accommodation, dining and activities ranked by green‑score, not just by stars."/>
              <Pillar Icon={Sparkles} bg="bg-gold-50" color="text-gold-500"
                      title="Rewards real action"
                      text="Points, badges and challenges close the intention–action gap — proven by behavioural science."/>
              <Pillar Icon={Users} bg="bg-moss-50" color="text-moss-700"
                      title="Spreads tourist flow"
                      text="Boosts off‑peak periods and less‑visited destinations to ease overtourism in Venice, Barcelona, Kyoto."/>
          </div>

          <footer className="border-t border-forest-100 bg-white">
              <div className="max-w-7xl mx-auto px-8 py-5 text-xs text-mute flex items-center justify-between">
                  <span>© 2026 EcoTrail — Lab Course Projects in Recommender Systems · TUM CM</span>
                  <span>Project A2 · Xuerong Xu, Yujie Liu · Supervisor: Ashmi Banerjee</span>
              </div>
          </footer>
      </div>
  )
}

function Stat({big, small, cite, gold}) {
    return (
        <div>
            <div className={`font-display text-3xl font-extrabold ${gold ? 'text-white' : 'text-white'}`}>{big}</div>
      <div className="text-xs text-white/90 mt-1">
        {small}<br /><span className="text-white/70">{cite}</span>
      </div>
    </div>
  )
}

function Pillar({ Icon, bg, color, title, text }) {
  return (
    <div className="rounded-2xl bg-white border border-forest-100 p-6 shadow-card">
      <div className={`w-10 h-10 rounded-xl ${bg} grid place-items-center ${color}`}>
        <Icon size={20} />
      </div>
      <div className="font-display font-bold text-lg mt-3">{title}</div>
      <p className="text-sm text-inkSoft mt-2">{text}</p>
    </div>
  )
}

function DeviceMock() {
  return (
    <div className="col-span-5">
    </div>
  )
}

function Mini({ label, value, valueClass = '' }) {
  return (
    <div className="rounded-xl border border-forest-100 p-3">
      <div className="text-xs text-mute">{label}</div>
      <div className={`font-display font-bold ${valueClass}`}>{value}</div>
    </div>
  )
}
