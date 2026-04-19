import { Trophy, Flag, DollarSign, Star, Swords } from 'lucide-react'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { formatRelativeTime, formatWalletBalance, profileDisplayName } from '@/lib/format'
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

function matchplayFeedLines(
  actor: Profile,
  secondary: Profile | undefined,
  metadata: Record<string, unknown>,
  fallbackDescription: string,
): { title: string; subtitle: string | null } {
  if (!secondary) {
    return { title: profileDisplayName(actor), subtitle: null }
  }
  const nameA = profileDisplayName(actor)
  const nameB = profileDisplayName(secondary)
  const title = `${nameA} vs ${nameB}`

  const resultRaw = metadata.result
  const result = typeof resultRaw === 'string' ? resultRaw : ''
  const margin = metadata.margin != null ? String(metadata.margin).trim() : ''
  const course = metadata.course != null ? String(metadata.course).trim() : ''

  let scorePart = ''
  if (result === 'draw') {
    scorePart = 'Halved'
  } else if (result === 'win_a') {
    scorePart = margin ? `${nameA} won ${margin}` : `${nameA} won`
  } else if (result === 'win_b') {
    scorePart = margin ? `${nameB} won ${margin}` : `${nameB} won`
  } else if (margin) {
    scorePart = margin
  }

  const subtitleBits = [scorePart, course].filter(Boolean)
  let subtitle = subtitleBits.length > 0 ? subtitleBits.join(' · ') : null
  if (!subtitle && fallbackDescription.includes(' at ')) {
    const tail = fallbackDescription.split(' at ').pop()?.trim()
    if (tail) subtitle = tail
  }
  return { title, subtitle }
}

function formatStrokeplayHcp(n: number): string {
  const rounded = Math.round(n * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function strokeplayFeedLines(
  actor: Profile,
  metadata: Record<string, unknown>,
  fallbackDescription: string,
): { title: string; subtitle: string | null } {
  const name = profileDisplayName(actor)
  const netRaw = metadata.net_score
  const net =
    netRaw != null && Number.isFinite(Number(netRaw)) ? Number(netRaw) : null
  const grossRaw = metadata.gross_score
  const gross =
    grossRaw != null && Number.isFinite(Number(grossRaw)) ? Number(grossRaw) : null
  const chRaw = metadata.course_handicap
  const courseHcp =
    chRaw != null && Number.isFinite(Number(chRaw)) ? Number(chRaw) : null
  const hcpLabel = courseHcp != null ? formatStrokeplayHcp(courseHcp) : null

  const course = metadata.course != null ? String(metadata.course).trim() : ''

  let title = name
  if (gross != null && hcpLabel != null && net != null) {
    title = `${name} · ${gross} (${hcpLabel}) · Net ${net}`
  } else if (gross != null && net != null) {
    title = `${name} · ${gross} gross · Net ${net}`
  } else if (gross != null && hcpLabel != null) {
    title = `${name} · ${gross} (${hcpLabel})`
  } else if (net != null) {
    title = `${name} · Net ${net}`
  }

  const subtitle = course || (net == null ? fallbackDescription : null)
  return { title, subtitle }
}

export function FeedItem({ type, actor, secondary_actor, description, metadata, created_at }: FeedItemProps) {
  const matchplay =
    type === 'matchplay'
      ? matchplayFeedLines(actor, secondary_actor, metadata, description)
      : null
  const strokeplay =
    type === 'strokeplay' ? strokeplayFeedLines(actor, metadata, description) : null

  const primaryText =
    type === 'matchplay' && matchplay
      ? matchplay.title
      : type === 'strokeplay' && strokeplay
        ? strokeplay.title
        : description

  const secondaryText =
    type === 'matchplay' && matchplay
      ? matchplay.subtitle
      : type === 'strokeplay' && strokeplay
        ? strokeplay.subtitle
        : null

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
        <p className="text-sm font-medium text-foreground leading-snug">{primaryText}</p>
        {secondaryText && (
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{secondaryText}</p>
        )}
        {type === 'wager' && metadata.amount != null && (
          <p
            className="text-xs font-bold mt-0.5"
            style={{ color: 'oklch(0.65 0.18 50)' }}
          >
            {Number.isFinite(Number(metadata.amount))
              ? formatWalletBalance(Number(metadata.amount))
              : '—'}
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
