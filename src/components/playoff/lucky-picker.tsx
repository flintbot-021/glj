import { useEffect, useRef, useState } from 'react'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { profileDisplayName, profileFirstName } from '@/lib/format'
import type { Profile } from '@/lib/types'

export function LuckyPicker({
  players,
  winnerId,
  onDone,
}: {
  players: Profile[]
  winnerId: string
  onDone: () => void
}) {
  const winner = players.find((p) => p.id === winnerId) ?? players[0]
  const [label, setLabel] = useState('…')
  const [landed, setLanded] = useState(false)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    if (!winner) {
      done.current()
      return
    }
    const pool = players.length > 0 ? players : [winner]
    let i = 0
    let timer = 0
    const ticks = Math.max(18, pool.length * 3)
    const step = () => {
      i += 1
      if (i >= ticks) {
        setLabel(profileFirstName(winner))
        setLanded(true)
        timer = window.setTimeout(() => done.current(), 700)
        return
      }
      const next = pool[i % pool.length] ?? winner
      setLabel(profileFirstName(next))
      const delay = i < 10 ? 70 : i < 15 ? 130 : 210
      timer = window.setTimeout(step, delay)
    }
    timer = window.setTimeout(step, 40)
    return () => window.clearTimeout(timer)
  }, [players, winner])

  return (
    <div className="flex flex-col items-center text-center px-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50 mb-4">Lucky picker</p>
      <div className="h-20 w-20 rounded-full border-2 border-white/20 bg-white/10 overflow-hidden flex items-center justify-center">
        {landed && winner ? (
          <PlayerAvatar player={winner} size="xl" className="h-20 w-20 text-2xl" />
        ) : (
          <span className="rtd-display text-3xl text-white/35">?</span>
        )}
      </div>
      <p className="rtd-display text-5xl text-white mt-4 leading-none tracking-wide">{label}</p>
      {landed && winner && (
        <p className="text-sm text-white/55 mt-1">{profileDisplayName(winner)}</p>
      )}
    </div>
  )
}
