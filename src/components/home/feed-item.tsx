import { Trophy, Flag, DollarSign, Star, Swords } from 'lucide-react'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { formatRelativeTime, profileDisplayName } from '@/lib/format'
import type { FeedItemType, Profile } from '@/lib/types'

const GREEN = 'oklch(0.22 0.068 157)'
const GOLD  = 'oklch(0.80 0.14 72)'
const GOLD_FG = 'oklch(0.18 0.06 60)'

const FEED_ICONS: Record<FeedItemType, React.ReactNode> = {
  matchplay:    <Swords className="h-4 w-4" />,
  strokeplay:   <Flag className="h-4 w-4" />,
  wager:        <DollarSign className="h-4 w-4" />,
  bonus_points: <Star className="h-4 w-4" />,
  knockout:     <Trophy className="h-4 w-4" />,
  tour_score:   <Flag className="h-4 w-4" />,
}

const FEED_COLORS: Record<FeedItemType, string> = {
  matchplay:    GREEN,
  strokeplay:   'oklch(0.42 0.15 260)',
  wager:        'oklch(0.65 0.18 50)',
  bonus_points: GOLD,
  knockout:     'oklch(0.60 0.18 330)',
  tour_score:   'oklch(0.42 0.15 260)',
}

// ── Data parsers ────────────────────────────────────────────────────────────

function parseMatchplay(actor: Profile, secondary: Profile | undefined, metadata: Record<string, unknown>, desc: string) {
  const nameA   = profileDisplayName(actor)
  const nameB   = secondary ? profileDisplayName(secondary) : null
  const result  = typeof metadata.result === 'string' ? metadata.result : ''
  const margin  = metadata.margin != null ? String(metadata.margin).trim() : ''
  const course  = metadata.course != null ? String(metadata.course).trim() : ''

  let outcome = ''
  if (result === 'draw')        outcome = 'Halved'
  else if (result === 'win_a')  outcome = nameB ? `${nameA} won` : 'Won'
  else if (result === 'win_b')  outcome = nameB ? `${nameB} won` : 'Won'
  else if (desc.toLowerCase().includes('halved')) outcome = 'Halved'

  return { nameA, nameB, margin, outcome, course, isHalved: result === 'draw' }
}

function parseStrokeplay(metadata: Record<string, unknown>, desc: string) {
  const toNum = (v: unknown) => v != null && Number.isFinite(Number(v)) ? Number(v) : null
  const gross  = toNum(metadata.gross_score)
  const net    = toNum(metadata.net_score)
  const hcp    = toNum(metadata.course_handicap)
  const hcpFmt = hcp != null
    ? (Number.isInteger(Math.round(hcp * 10) / 10) ? String(hcp) : hcp.toFixed(1))
    : null
  const course = metadata.course != null ? String(metadata.course).trim() : ''
  const fallback = course || desc
  return { gross, net, hcpFmt, course, fallback }
}

function parseWager(metadata: Record<string, unknown>, description: string) {
  const parts   = description.split(' · ')
  const matchup = parts[0] ?? description
  const [teamA, teamB] = matchup.split(' vs ')

  const toNum = (v: unknown) => v != null && Number.isFinite(Number(v)) ? Number(v) : null
  const amount  = toNum(metadata.amount)
  const halved  = metadata.halved === true
  const isTeam  = metadata.team_wager === true
  const margin  = metadata.margin != null ? String(metadata.margin).trim() : ''
  const course  = metadata.course != null ? String(metadata.course).trim() : ''

  // Result label comes from the 2nd description segment
  const resultSeg = parts[1] ?? ''

  let money: string | null = null
  if (!halved && amount != null) {
    const total = isTeam ? amount * 2 : amount
    money = `R ${total % 1 === 0 ? total.toFixed(0) : total.toFixed(2)}`
  }

  return { teamA: teamA?.trim() ?? matchup, teamB: teamB?.trim() ?? null, margin, resultSeg, halved, money, course }
}

// ── Shared sub-components ───────────────────────────────────────────────────

function StatCol({ label, value, highlight = false, muted = false, className = '' }: {
  label: string
  value: string
  highlight?: boolean
  muted?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className="num mt-1 text-[22px] font-bold leading-none"
        style={{ color: highlight ? GOLD : muted ? 'oklch(0.65 0 0)' : 'oklch(0.14 0.03 157)' }}
      >
        {value}
      </p>
    </div>
  )
}

function TypeBadge({ type }: { type: FeedItemType }) {
  return (
    <div
      className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-white"
      style={{ backgroundColor: `${FEED_COLORS[type]}22`, color: FEED_COLORS[type] }}
    >
      {FEED_ICONS[type]}
    </div>
  )
}

function VsTitle({ nameA, nameB, time, course }: { nameA: string; nameB: string | null; time: string; course?: string }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="text-sm font-bold leading-snug text-foreground">{nameA}</span>
        {nameB && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">vs</span>
        )}
      </div>
      {nameB && <p className="text-sm font-bold leading-snug text-foreground">{nameB}</p>}
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {time}{course ? ` · ${course}` : ''}
      </p>
    </div>
  )
}

function Pill({ label, green }: { label: string; green?: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={green
        ? { backgroundColor: GREEN, color: 'white' }
        : { backgroundColor: 'oklch(0.92 0.005 157)', color: 'oklch(0.50 0 0)' }}
    >
      {label}
    </span>
  )
}

// ── Main export ─────────────────────────────────────────────────────────────

interface FeedItemProps {
  type: FeedItemType
  actor: Profile
  secondary_actor?: Profile
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

export function FeedItem({ type, actor, secondary_actor, description, metadata, created_at }: FeedItemProps) {
  const time = formatRelativeTime(created_at)

  // ── Strokeplay ──────────────────────────────────────────────────────────
  if (type === 'strokeplay') {
    const { gross, net, hcpFmt, course } = parseStrokeplay(metadata, description)
    return (
      <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.04]">
        <div className="flex items-start gap-3">
          <PlayerAvatar player={actor} size="md" />
          <VsTitle nameA={profileDisplayName(actor)} nameB={null} time={time} course={course} />
          <TypeBadge type={type} />
        </div>
        {(gross != null || net != null) && (
          <>
            <div className="my-3 h-px bg-border" />
            <div className="flex items-end gap-6">
              {gross != null && <StatCol label="Gross" value={String(gross)} />}
              {hcpFmt != null && <StatCol label="Handicap" value={`(${hcpFmt})`} muted />}
              {net != null && <StatCol label="Net Score" value={String(net)} highlight className="ml-auto text-right" />}
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Matchplay ───────────────────────────────────────────────────────────
  if (type === 'matchplay') {
    const { nameA, nameB, margin, outcome, course, isHalved } = parseMatchplay(actor, secondary_actor, metadata, description)
    const ringColor = 'oklch(0.88 0.08 72)'
    return (
      <div
        className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: 'oklch(0.975 0.022 72)', borderLeft: `3px solid ${GOLD}` }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-4 pt-4 pb-3">
          <div className="flex -space-x-2 flex-shrink-0">
            <PlayerAvatar player={actor} size="md" className="ring-2" style={{ '--tw-ring-color': ringColor } as React.CSSProperties} />
            {secondary_actor && (
              <PlayerAvatar player={secondary_actor} size="md" className="ring-2" style={{ '--tw-ring-color': ringColor } as React.CSSProperties} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm font-bold leading-snug" style={{ color: GOLD_FG }}>{nameA}</span>
              {nameB && <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${GOLD_FG}66` }}>vs</span>}
            </div>
            {nameB && <p className="text-sm font-bold leading-snug" style={{ color: GOLD_FG }}>{nameB}</p>}
            <p className="mt-0.5 text-[11px]" style={{ color: `${GOLD_FG}99` }}>
              {time}{course ? ` · ${course}` : ''}
            </p>
          </div>
          {/* Gold badge for matchplay */}
          <div
            className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: GOLD, color: GOLD_FG }}
          >
            <Swords className="h-4 w-4" />
          </div>
        </div>

        {/* Result strip */}
        {(outcome || margin) && (
          <div
            className="mx-4 mb-4 rounded-xl flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: GOLD }}
          >
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: `${GOLD_FG}99` }}>Result</p>
              <p className="num text-[22px] font-bold leading-none mt-1" style={{ color: GOLD_FG }}>
                {margin || '—'}
              </p>
            </div>
            {outcome && (
              <span
                className="rtd-display text-[28px] leading-none tracking-wide"
                style={{ color: isHalved ? `${GOLD_FG}66` : GREEN }}
              >
                {isHalved ? 'HALVED' : 'WIN'}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Wager ───────────────────────────────────────────────────────────────
  if (type === 'wager') {
    const { teamA, teamB, margin, resultSeg, halved, money } = parseWager(metadata, description)
    return (
      <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.04]">
        <div className="flex items-start gap-3">
          <div className="flex -space-x-2 flex-shrink-0">
            <PlayerAvatar player={actor} size="md" className="ring-2 ring-card" />
            {secondary_actor && <PlayerAvatar player={secondary_actor} size="md" className="ring-2 ring-card" />}
          </div>
          <VsTitle nameA={teamA} nameB={teamB ?? null} time={time} />
          <TypeBadge type={type} />
        </div>
        {(resultSeg || money) && (
          <>
            <div className="my-3 h-px bg-border" />
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Result</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {margin && (
                    <span className="num text-[22px] font-bold leading-none text-foreground">{margin}</span>
                  )}
                  <Pill label={halved ? 'Halved' : 'Win'} green={!halved} />
                </div>
              </div>
              {money && (
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    {halved ? 'No transfer' : 'Transfer'}
                  </p>
                  {!halved && (
                    <p className="num text-[22px] font-bold leading-none mt-1.5" style={{ color: GOLD }}>
                      {money}
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Bonus / Knockout / Tour / fallback ──────────────────────────────────
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.04]">
      <div className="flex items-start gap-3">
        <PlayerAvatar player={actor} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug text-foreground">{description}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{time}</p>
        </div>
        <TypeBadge type={type} />
      </div>
    </div>
  )
}
