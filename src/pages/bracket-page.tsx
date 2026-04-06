import { useKnockoutBracket } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Profile } from '@/lib/types'

export function BracketPage() {
  const { data: fixtures, isLoading } = useKnockoutBracket()

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  const qfs = fixtures?.filter((f) => f.round === 'qf') ?? []
  const sfs = fixtures?.filter((f) => f.round === 'sf') ?? []
  const finals = fixtures?.filter((f) => f.round === 'final') ?? []

  return (
    <div className="py-4">
      <div className="px-4 mb-6">
        <h1 className="text-2xl font-black tracking-tight">Knockout Bracket</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Top 2 from each group advance
        </p>
      </div>

      {/* Bracket visualization — horizontal scroll */}
      <div className="overflow-x-auto scrollbar-hide px-4">
        <div className="flex gap-4 min-w-max pb-4">
          {/* QF Column */}
          <BracketColumn label="Quarter Finals" count="8 players">
            {qfs.map((f, i) => (
              <FixtureCard
                key={f.id}
                player_a={f.player_a}
                player_b={f.player_b}
                result={f.result}
                margin={f.margin}
                course={f.course_name}
                matchNum={i + 1}
              />
            ))}
          </BracketColumn>

          {/* Connector */}
          <BracketConnector count={4} />

          {/* SF Column */}
          <BracketColumn label="Semi Finals" count="4 players">
            {sfs.map((f, i) => (
              <FixtureCard
                key={f.id}
                player_a={f.player_a}
                player_b={f.player_b}
                result={f.result}
                margin={f.margin}
                course={f.course_name}
                matchNum={i + 1}
              />
            ))}
          </BracketColumn>

          {/* Connector */}
          <BracketConnector count={2} />

          {/* Final Column */}
          <BracketColumn label="Final" count="2 players">
            {finals.map((f) => (
              <FixtureCard
                key={f.id}
                player_a={f.player_a}
                player_b={f.player_b}
                result={f.result}
                margin={f.margin}
                course={f.course_name}
                matchNum={1}
                isFinal
              />
            ))}
          </BracketColumn>
        </div>
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
  player_a,
  player_b,
  result,
  margin,
  course,
  matchNum,
  isFinal = false,
}: {
  player_a?: Profile
  player_b?: Profile
  result?: 'win_a' | 'win_b'
  margin?: string
  course?: string
  matchNum: number
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
      {/* Match header */}
      <div className="px-3 py-1.5 bg-muted/50 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          Match {matchNum}
        </span>
        {result && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {margin}
          </Badge>
        )}
      </div>

      {/* Players */}
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
            {player.display_name}
          </span>
          {isWinner && (
            <span className="text-[10px]">🏆</span>
          )}
        </>
      ) : (
        <span className="text-xs text-muted-foreground/50 italic">TBD</span>
      )}
    </div>
  )
}
