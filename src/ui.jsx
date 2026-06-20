// ============================================================================
//  EcoTrail — shared UI primitives + Toast/Modal context
//  These are tiny re-used building blocks: Logo, Toast system, Modal, Switch,
//  CrowdBar, PointsPill.
// ============================================================================

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { Sparkles, Check, X } from 'lucide-react'

/* ─── Logo ─────────────────────────────────────────────────────────────── */
export function Logo({ variant = 'dark', size = 'md' }) {
  const box =
    variant === 'dark'
      ? 'bg-white/15 text-white'
      : variant === 'light'
      ? 'gradient-forest text-white'
      : 'gradient-forest text-white'
  const sizes = { sm: 'w-8 h-8', md: 'w-9 h-9' }
  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes[size]} rounded-xl grid place-items-center ${box}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M4 20c0-9 7-16 16-16 0 9-7 16-16 16Z" fill="currentColor" />
          <path d="M4 20 14 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <span className="font-display font-extrabold text-lg">EcoTrail</span>
    </div>
  )
}

/* ─── Switch (toggle) ──────────────────────────────────────────────────── */
export function Switch({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange?.(!checked)}
      className={`w-[38px] h-[22px] rounded-full relative transition-colors ${
        checked ? 'bg-forest-600' : 'bg-forest-100'
      }`}
    >
      <span
        className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${
          checked ? 'left-[18px]' : 'left-[2px]'
        }`}
      />
    </button>
  )
}

/* ─── Crowd bar (small bar-chart icon) ─────────────────────────────────── */
export function CrowdBar({ level = 0 }) {
  // level 0..5 — number of green bars
  return (
    <span className="crowd-bar">
      {[2, 3, 4, 5, 6].map((h, i) => (
        <i key={i} className={`${i < level ? 'on' : ''}`} style={{ height: `${h * 3}px` }} />
      ))}
    </span>
  )
}

/* ─── Toast Context ────────────────────────────────────────────────────── */
const ToastCtx = createContext(null)
export function useToast() { return useContext(ToastCtx) }

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const showToast = useCallback((message, type = 'gold') => {
    setToast({ message, type })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  return (
    <ToastCtx.Provider value={showToast}>
      {children}
      <div
        className={`fixed bottom-6 right-6 z-[80] transition-transform duration-300 ${
          toast ? 'translate-y-0' : 'translate-y-[200%]'
        }`}
      >
        {toast && (
          <div className="rounded-2xl bg-white shadow-cardHover border border-forest-100 px-4 py-3 flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full grid place-items-center font-display font-extrabold ${
                toast.type === 'forest'
                  ? 'bg-forest-100 text-forest-700'
                  : 'gradient-gold text-forest-800'
              }`}
            >
              {toast.type === 'forest' ? <Check size={16} /> : <Sparkles size={16} />}
            </div>
            <div className="text-sm font-medium">{toast.message}</div>
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  )
}

/* ─── Modal ────────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-forest-900/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[640px] max-w-[92vw] bg-white rounded-3xl border border-forest-100 shadow-cardHover overflow-hidden animate-pop">
        <div className="h-32 gradient-forest text-white flex items-end p-5">
          <div>
            <div className="text-xs uppercase tracking-widest text-moss-200">Trip details</div>
            <div className="font-display text-2xl font-extrabold">{title}</div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 grid place-items-center"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-6 text-sm">{children}</div>
        {footer && <div className="px-6 pb-6 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}

/* ─── Score / Green dot indicator ──────────────────────────────────────── */
export function Dot({ color = 'bg-forest-500' }) {
  return <span className={`dot ${color}`} />
}

/* ─── Tab ──────────────────────────────────────────────────────────────── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-6 px-6 pt-5 border-b border-forest-100 text-sm font-semibold">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`pb-3 px-1 border-b-2 transition ${
            active === t.id
              ? 'text-forest-700 border-forest-700'
              : 'text-inkSoft border-transparent hover:text-forest-600'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
