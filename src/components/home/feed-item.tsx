import { Trophy, Flag, DollarSign, Star, Swords } from 'lucide-react'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { formatRelativeTime } from '@/lib/format'
import type { FeedItemType } from '@/lib/types'
import type { Profile } from '@/lib/types'

interface FeedItemProps {
  type: FeedItemType
  actor: Profile
  secondary_actor?: Profile
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

const FEED_ICONS: Record<FeedItemType, React.ReactNode> = {
  matchplay: <Swords className="h-3.5 w-3.5" />,
  strokeplay: <Flag className="h-3.5 w-3.5" />,
  wager: <DollarSign className="h-3.5 w-3.5" />,
  bonus_points: <Star className="h-3.5 w-3.5" />,
  knockout: <Trophy className="h-3.5 w-3.5" />,
  tour_score: <Flag className="h-3.5 w-3.5" />,
}

const FEED_COLORS: Record<FeedItemType, string> = {
  matchplay: 'oklch(0.29 0.072 160)',
  strokeplay: 'oklch(0.42 0.15 260)',
  wager: 'oklch(0.65 0.18 50)',
  bonus_points: 'oklch(0.91 0.19 106)',
  knockout: 'oklch(0.60 0.18 330)',
  tour_score: 'oklch(0.42 0.15 260)',
}

export function FeedItem({ type, actor, secondary_actor, description, metadata, created_at }: FeedItemProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      {/* Avatar stack */}
      <div className="relative flex-shrink-0">
        <PlayerAvatar player={actor} size="sm" />
        {secondary_actor && (
          <div className="absolute -bottom-1 -right-1">
            <PlayerAvatar player={secondary_actor} size="xs" className="ring-2 ring-background" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">{description}</p>
        {type === 'wager' && metadata.amount && (
          <p
            className="text-xs font-bold mt-0.5"
            style={{ color: 'oklch(0.65 0.18 50)' }}
          >
            €{String(metadata.amount)}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(created_at)}</p>
      </div>

      {/* Type badge */}
      <div
        className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-white"
        style={{ backgroundColor: FEED_COLORS[type] }}
      >
        {FEED_ICONS[type]}
      </div>
    </div>
  )
}
