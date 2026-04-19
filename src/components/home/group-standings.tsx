import { useRef, useState } from 'react'
import { useAllGroupStandings } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPoints, profileDisplayName } from '@/lib/format'
import { cn } from '@/lib/utils'

export function GroupStandings() {
  const { data: allGroups, isLoading } = useAllGroupStandings()
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, offsetWidth } = scrollRef.current
    const index = Math.round(scrollLeft / (offsetWidth * 0.85))
    setActiveIndex(Math.min(index, (allGroups?.length ?? 1) - 1))
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-hidden px-4">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-xl overflow-hidden animate-pulse"
            style={{ width: 'calc(85vw)', maxWidth: 320, backgroundColor: 'oklch(0.22 0.068 157)' }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid oklch(0.30 0.068 157)' }}>
              <div className="h-3.5 w-24 rounded-full bg-white/15" />
              <div className="h-3 w-12 rounded-full bg-white/10" />
            </div>
            {/* Column labels */}
            <div className="px-4 pt-2 pb-1 flex justify-between">
              <div className="h-2.5 w-12 rounded-full bg-white/10" />
              <div className="flex gap-6">
                {[0,1,2].map(j => <div key={j} className="h-2.5 w-6 rounded-full bg-white/10" />)}
              </div>
            </div>
            {/* Rows */}
            {[0,1,2,3,4].map((j) => (
              <div key={j} className="px-4 py-2.5 flex items-center gap-3" style={{ borderTop: '1px solid oklch(0.30 0.068 157 / 0.5)' }}>
                <div className="h-3 w-4 rounded-full bg-white/10" />
                <div className="h-7 w-7 rounded-full bg-white/15" />
                <div className="flex-1 h-3 rounded-full bg-white/15" style={{ maxWidth: `${55 + j * 8}%` }} />
                <div className="flex gap-5">
                  {[0,1].map(k => <div key={k} className="h-3 w-5 rounded-full bg-white/10" />)}
                  <div className="h-3 w-7 rounded-full bg-white/20" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory"
        style={{ scrollPaddingLeft: '1rem' }}
      >
        {allGroups?.map(({ group, standings }) => (
          <div
            key={group.id}
            className="flex-shrink-0 snap-start rounded-xl overflow-hidden"
            style={{
              width: 'calc(85vw)',
              maxWidth: 320,
              backgroundColor: 'oklch(0.22 0.068 157)',
            }}
          >
            {/* Group header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid oklch(0.30 0.068 157)' }}
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">
                {group.name}
              </h3>
              <span className="text-[10px] text-white/50 font-medium">
                {standings.length} players
              </span>
            </div>

            {/* Column headers */}
            <div className="flex items-center px-4 py-2">
              <div className="flex-1" />
              <div className="flex gap-4 text-[10px] font-semibold uppercase tracking-wider text-white/40 w-28 justify-end">
                <span className="w-12 text-center">W-L-D</span>
                <span className="w-8 text-right">Pts</span>
              </div>
            </div>

            {/* Players */}
            <div className="pb-3">
              {standings.map((s, idx) => (
                <div
                  key={s.player.id}
                  className={cn(
                    'flex items-center px-4 py-2.5 gap-3',
                    idx === 0 && 'bg-white/5'
                  )}
                >
                  <span className="text-xs font-bold text-white/40 w-4">{idx + 1}</span>
                  <PlayerAvatar player={s.player} size="sm" />
                  <span className="flex-1 min-w-0 text-sm font-semibold text-white truncate">
                    {profileDisplayName(s.player)}
                  </span>
                  <div className="flex gap-4 items-center w-28 justify-end">
                    <span className="text-xs text-white/60 w-12 text-center">
                      {s.wins}-{s.losses}-{s.draws}
                    </span>
                    <span
                      className="text-sm font-black w-8 text-right"
                      style={{ color: 'oklch(0.80 0.14 72)' }}
                    >
                      {formatPoints(s.total_points)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {allGroups?.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              const el = scrollRef.current
              if (!el) return
              el.scrollTo({ left: i * el.offsetWidth * 0.85, behavior: 'smooth' })
              setActiveIndex(i)
            }}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === activeIndex ? 16 : 6,
              backgroundColor: i === activeIndex ? 'oklch(0.80 0.14 72)' : 'oklch(0.70 0 0)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
