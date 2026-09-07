import { useEffect, useRef, useState } from 'react'
import type { PlayoffSlotDef, PlayoffSlotKey } from '@/lib/playoff-draw'

const COLORS = [
  'oklch(0.80 0.14 72)',
  'oklch(0.42 0.15 260)',
  'oklch(0.55 0.12 200)',
  'oklch(0.60 0.18 330)',
  'oklch(0.50 0.21 26)',
  'oklch(0.65 0.18 50)',
  'oklch(0.32 0.08 157)',
  'oklch(0.22 0.068 157)',
]

const GOLD = 'oklch(0.80 0.14 72)'

function hubLabel(slot: PlayoffSlotDef | undefined) {
  if (!slot) return 'SPIN'
  return `${slot.half === 'left' ? 'L' : 'R'} QF${slot.qf}`
}

export function DrawWheel({
  slots,
  winnerKey,
  spinning,
  onDone,
}: {
  slots: PlayoffSlotDef[]
  winnerKey: PlayoffSlotKey | null
  spinning: boolean
  onDone: () => void
}) {
  const [deg, setDeg] = useState(0)
  const [animated, setAnimated] = useState(false)
  const [landed, setLanded] = useState(false)
  const done = useRef(onDone)
  done.current = onDone
  const n = Math.max(1, slots.length)
  const winner = slots.find((s) => s.key === winnerKey)

  useEffect(() => {
    if (!spinning || !winnerKey || slots.length === 0) return
    const idx = Math.max(0, slots.findIndex((s) => s.key === winnerKey))
    const target = 6 * 360 - (idx + 0.5) * (360 / n)
    setLanded(false)
    setAnimated(false)
    setDeg(0)
    const frame = requestAnimationFrame(() => {
      setAnimated(true)
      setDeg(target)
    })
    const land = window.setTimeout(() => setLanded(true), 4200)
    const timer = window.setTimeout(() => done.current(), 4800)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(land)
      window.clearTimeout(timer)
    }
  }, [spinning, winnerKey, n, slots])

  const gradient = slots
    .map((_, i) => {
      const color = COLORS[i % COLORS.length]
      const from = (i / n) * 360
      const to = ((i + 1) / n) * 360
      return `${color} ${from}deg ${to}deg`
    })
    .join(', ')

  return (
    <div className="relative mx-auto" style={{ width: 268, height: 268 }}>
      <div
        className="absolute left-1/2 -top-1 z-20 -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '16px solid oklch(0.80 0.14 72)',
        }}
      />
      <div
        className="h-full w-full rounded-full border-4 border-white/20 shadow-2xl relative overflow-hidden"
        style={{
          background: `conic-gradient(from -90deg, ${gradient})`,
          transform: `rotate(${deg}deg)`,
          transition: animated ? 'transform 4.2s cubic-bezier(0.12, 0.72, 0.08, 1)' : 'none',
        }}
      >
        {slots.map((slot, i) => {
          const angle = -90 + (i + 0.5) * (360 / n)
          return (
            <span
              key={slot.key}
              className="absolute left-1/2 top-1/2 text-[10px] font-black uppercase tracking-wide text-white whitespace-nowrap"
              style={{
                transform: `rotate(${angle}deg) translate(78px) rotate(90deg)`,
                textShadow: '0 1px 2px rgba(0,0,0,0.45)',
              }}
            >
              {slot.wheel}
            </span>
          )
        })}
      </div>
      <div
        className="absolute inset-[34%] rounded-full border-2 border-white/25 flex items-center justify-center text-center px-2"
        style={{ backgroundColor: 'oklch(0.17 0.055 157)' }}
      >
        <span className="rtd-display text-[28px] leading-none tracking-wide" style={{ color: GOLD }}>
          {landed ? hubLabel(winner) : 'SPIN'}
        </span>
      </div>
    </div>
  )
}
