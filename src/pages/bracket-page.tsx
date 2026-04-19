import { useMemo } from 'react'
import { Info, Trophy } from 'lucide-react'
import { useActiveSeason, useAllGroupStandings, useKnockoutBracket } from '@/hooks/use-data'
import { TOURNAMENT_STRUCTURE } from '@/lib/league-rules'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { GroupStanding, Profile } from '@/lib/types'
import { formatPoints, profileDisplayName } from '@/lib/format'

export function BracketPage() {
  const { data: season } = useActiveSeason()
  const { data: fixtures, isLoading: fxLoading } = useKnockoutBracket()
  const { data: allStandings, isLoading: stLoading } = useAllGroupStandings()

  const bySlot = (round: 'qf' | 'sf' | 'final') =>
    (fixtures?.filter((f) => f.round === round) ?? []).sort((a, b) => (a.slot_index ?? 0) - (b.slot_index ?? 0))

  const qfs = bySlot('qf')
  const sfs = bySlot('sf')
  const finals = bySlot('final')

  const hasDrawContent = Boolean(fixtures?.some((f) => f.player_a_id || f.player_b_id))
  const hasFixtureRows = (fixtures?.length ?? 0) > 0
  const showPlaceholderGrid = !fxLoading && !hasFixtureRows

  const topTwoByGroup = useMemo(() => {
    if (!allStandings?.length) return []
    return allStandings.map(({ group, standings }) => {
      const sorted = [...standings].sort((a, b) => b.total_points - a.total_points)
      return {
        groupName: group.name,
        top: sorted.slice(0, TOURNAMENT_STRUCTURE.knockoutFromEachGroup),
      }
    })
  }, [allStandings])

  const slotLabel = (round: 'qf' | 'sf' | 'final', slot: number) =>
    round === 'final' ? 'Final' : `${round === 'qf' ? 'QF' : 'SF'} ${slot}`

  if (fxLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="py-4 space-y-6">
      <div className="px-4">
        <h1 className="text-2xl font-black tracking-tight">Knockout bracket</h1>
        {season?.name && (
          <p className="text-sm text-muted-foreground mt-0.5">{season.name}</p>
        )}
      </div>

      <div className="px-4 space-y-3">
        <Card className="border-primary/20 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-primary shrink-0" />
              How the knockout works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <span className="text-foreground font-medium">Group stage first.</span> Everyone plays match-play within
              their group. Points add up from wins, draws, and losses — plus any stroke bonus you’ve earned.
            </p>
            <p>
              <span className="text-foreground font-medium">
                Top {TOURNAMENT_STRUCTURE.knockoutFromEachGroup} from each group
              </span>{' '}
              qualify for the knockout ({TOURNAMENT_STRUCTURE.groupsSummary} → eight qualifiers).
            </p>
            <p>
              <span className="text-foreground font-medium">Then a fresh draw</span> is made for each knockout round
              (quarters, semis, final). The bracket here tracks those matchups — pairings are set after each draw, not
              by a fixed “1st in Group A vs …” tree.
            </p>
          </CardContent>
        </Card>

        {!hasDrawContent && (
          <div
            className="rounded-xl border px-4 py-3 flex gap-3"
            style={{
              borderColor: 'oklch(0.55 0.15 260 / 0.35)',
              backgroundColor: 'oklch(0.42 0.15 260 / 0.08)',
            }}
          >
            <Trophy className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'oklch(0.60 0.18 330)' }} />
            <div>
              <p className="text-sm font-semibold text-foreground">Knockout pending</p>
              <p className="text-sm text-muted-foreground mt-1">
                The draw hasn’t been published yet, or no matchups have been filled in. When the organiser sets
                pairings, they’ll show in the bracket below. Until then, you can see who’s leading each group.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Current group leaders</CardTitle>
            <p className="text-xs text-muted-foreground font-normal">
              Top {TOURNAMENT_STRUCTURE.knockoutFromEachGroup} per group by total points (match-play + bonus) — the usual
              qualification picture. Final knockout places are confirmed after the group stage.
            </p>
          </CardHeader>
          <CardContent>
            {stLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 rounded-lg" />
                <Skeleton className="h-14 rounded-lg" />
              </div>
            ) : topTwoByGroup.length === 0 ? (
              <p className="text-sm text-muted-foreground">No group standings yet.</p>
            ) : (
              <div className="space-y-4">
                {topTwoByGroup.map(({ groupName, top }) => (
                  <div key={groupName}>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">{groupName}</p>
                    <ul className="space-y-2">
                      {top.map((row, i) => (
                        <LeaderRow key={row.player.id} standing={row} rank={i + 1} />
                      ))}
                      {top.length === 0 && (
                        <li className="text-sm text-muted-foreground">No players in this group yet.</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="px-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">Draw &amp; results</h2>
      </div>

      {/* Bracket visualization — horizontal scroll */}
      <div className="overflow-x-auto scrollbar-hide px-4">
        <div className="flex gap-4 min-w-max pb-4">
          {showPlaceholderGrid ? (
            <>
              <BracketColumn label="Quarter-finals" count="8 qualifiers">
                {[1, 2, 3, 4].map((n) => (
                  <PendingSlotCard key={n} label={slotLabel('qf', n)} />
                ))}
              </BracketColumn>
              <BracketConnector count={4} />
              <BracketColumn label="Semi-finals" count="4 players">
                {[1, 2].map((n) => (
                  <PendingSlotCard key={n} label={slotLabel('sf', n)} />
                ))}
              </BracketColumn>
              <BracketConnector count={2} />
              <BracketColumn label="Final" count="2 players">
                <PendingSlotCard label="Final" />
              </BracketColumn>
            </>
          ) : (
            <>
              <BracketColumn label="Quarter-finals" count="8 qualifiers">
                {qfs.map((f) => (
                  <FixtureCard
                    key={f.id}
                    matchLabel={slotLabel('qf', f.slot_index)}
                    player_a={f.player_a}
                    player_b={f.player_b}
                    result={f.result}
                    margin={f.margin}
                    course={f.course_name}
                  />
                ))}
              </BracketColumn>

              <BracketConnector count={4} />

              <BracketColumn label="Semi-finals" count="4 players">
                {sfs.map((f) => (
                  <FixtureCard
                    key={f.id}
                    matchLabel={slotLabel('sf', f.slot_index)}
                    player_a={f.player_a}
                    player_b={f.player_b}
                    result={f.result}
                    margin={f.margin}
                    course={f.course_name}
                  />
                ))}
              </BracketColumn>

              <BracketConnector count={2} />

              <BracketColumn label="Final" count="2 players">
                {finals.map((f) => (
                  <FixtureCard
                    key={f.id}
                    matchLabel={slotLabel('final', f.slot_index)}
                    player_a={f.player_a}
                    player_b={f.player_b}
                    result={f.result}
                    margin={f.margin}
                    course={f.course_name}
                    isFinal
                  />
                ))}
              </BracketColumn>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function LeaderRow({ standing, rank }: { standing: GroupStanding; rank: number }) {
  const p = standing.player
  return (
    <li className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2">
      <span className="text-xs font-bold tabular-nums w-5 text-muted-foreground">{rank}</span>
      <PlayerAvatar player={p} size="xs" />
      <span className="text-sm font-medium flex-1 truncate">{profileDisplayName(p)}</span>
      <span className="text-sm font-semibold tabular-nums" style={{ color: 'oklch(0.22 0.068 157)' }}>
        {formatPoints(standing.total_points)}
        <span className="text-[10px] font-normal text-muted-foreground ml-0.5">pts</span>
      </span>
    </li>
  )
}

function PendingSlotCard({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-muted-foreground/35 bg-muted/15 overflow-hidden">
      <div className="px-3 py-1.5 bg-muted/40 border-b border-border border-dashed">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <div className="px-3 py-6 text-center">
        <p className="text-xs text-muted-foreground italic">Awaiting draw</p>
      </div>
    </div>
  )
}

function BracketColumn({
  label,
  count,
  children,
}: {
  label: string
  count: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 w-56">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground/60">{count}</p>
      </div>
      <div className="flex flex-col gap-3 justify-around flex-1">
        {children}
      </div>
    </div>
  )
}

function BracketConnector({ count }: { count: number }) {
  return (
    <div className="flex flex-col justify-around pt-12" style={{ width: 24 }}>
      {Array.from({ length: count / 2 }).map((_, i) => (
        <svg key={i} width="24" height="80" viewBox="0 0 24 80" fill="none">
          <path
            d="M0 20 H12 V60 H24"
            stroke="oklch(0.80 0 0)"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      ))}
    </div>
  )
}

function FixtureCard({
  matchLabel,
  player_a,
  player_b,
  result,
  margin,
  course,
  isFinal = false,
}: {
  matchLabel: string
  player_a?: Profile
  player_b?: Profile
  result?: 'win_a' | 'win_b'
  margin?: string
  course?: string
  isFinal?: boolean
}) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: isFinal ? 'oklch(0.91 0.19 106 / 0.5)' : undefined,
        boxShadow: isFinal ? '0 0 0 2px oklch(0.91 0.19 106 / 0.2)' : undefined,
      }}
    >
      <div className="px-3 py-1.5 bg-muted/50 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{matchLabel}</span>
        {result && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {margin}
          </Badge>
        )}
      </div>

      <div className="divide-y divide-border">
        <PlayerRow
          player={player_a}
          isWinner={result === 'win_a'}
          hasResult={!!result}
        />
        <PlayerRow
          player={player_b}
          isWinner={result === 'win_b'}
          hasResult={!!result}
        />
      </div>

      {course && result && (
        <div className="px-3 py-1.5 bg-muted/30 border-t border-border">
          <p className="text-[10px] text-muted-foreground truncate">{course}</p>
        </div>
      )}
    </div>
  )
}

function PlayerRow({
  player,
  isWinner,
  hasResult,
}: {
  player?: Profile
  isWinner: boolean
  hasResult: boolean
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5"
      style={{
        backgroundColor: isWinner ? 'oklch(0.91 0.19 106 / 0.1)' : undefined,
      }}
    >
      {player ? (
        <>
          <PlayerAvatar player={player} size="xs" />
          <span
            className="text-xs font-semibold flex-1 truncate"
            style={{ color: isWinner ? 'oklch(0.30 0.09 155)' : hasResult ? 'var(--muted-foreground)' : undefined }}
          >
            {profileDisplayName(player)}
          </span>
          {isWinner && <span className="text-[10px]">🏆</span>}
        </>
      ) : (
        <span className="text-xs text-muted-foreground/50 italic">TBD</span>
      )}
    </div>
  )
}
