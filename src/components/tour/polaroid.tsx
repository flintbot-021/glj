import { cn } from '@/lib/utils'
import { TOUR_GOLD, TOUR_GREEN } from '@/lib/tour-colors'
import type { TourScrapbookEntry } from '@/lib/types'

export function Polaroid({
  entry,
  courseName,
  authorName,
  rotate = 0,
  className,
  onClick,
  large,
  width,
}: {
  entry: TourScrapbookEntry
  courseName?: string | null
  authorName?: string
  rotate?: number
  className?: string
  onClick?: () => void
  large?: boolean
  width?: number
}) {
  const hole = entry.hole_number
  const place = [courseName, hole != null ? `Hole ${hole}` : null].filter(Boolean).join(' · ')
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { type: 'button' as const } : {})}
      onClick={onClick}
      className={cn(
        'bg-white text-left shadow-none',
        large ? 'p-3 pb-4 w-full max-w-[22rem]' : 'p-2 pb-3',
        !large && !width && 'w-[9.5rem]',
        className,
      )}
      style={{
        transform: `rotate(${rotate}deg)`,
        backgroundColor: 'oklch(0.97 0.01 90)',
        width: !large && width ? width : undefined,
      }}
    >
      <div
        className={cn('relative overflow-hidden bg-muted', large ? 'aspect-square' : 'h-28')}
        style={{ backgroundColor: TOUR_GREEN }}
      >
        <img
          src={entry.photo_url}
          alt={entry.caption || place || 'Tour snap'}
          className="h-full w-full object-cover"
        />
        {place && (
          <span
            className="absolute left-1.5 bottom-1.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 text-white"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          >
            {place}
          </span>
        )}
      </div>
      <p
        className={cn(
          'mt-2 font-bold leading-snug px-0.5',
          large ? 'text-base' : 'text-[11px] min-h-[2.2rem]',
        )}
        style={{ color: TOUR_GREEN }}
      >
        {entry.caption || '—'}
      </p>
      {authorName && (
        <p className="text-[9px] font-bold uppercase tracking-wider text-black/40 px-0.5 mt-0.5">
          {authorName}
          {entry.day_number ? ` · D${entry.day_number}` : ''}
        </p>
      )}
      <span
        className="mt-1 block h-0.5 w-8"
        style={{ backgroundColor: TOUR_GOLD }}
      />
    </Tag>
  )
}
