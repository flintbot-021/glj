import { useState } from 'react'
import { useAllGroupStandings, usePlayerRounds, usePlayers, useWagers } from '@/hooks/use-data'
import { useAuthStore } from '@/stores/auth-store'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatPoints, formatWalletBalance, profileDisplayName } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

type StatsTab = 'matchplay' | 'strokeplay' | 'wagers'

export function StatsPage() {
  const [tab, setTab] = useState<StatsTab>('matchplay')
  const profile = useAuthStore((s) => s.profile)

  return (
    <div className="py-4">
      <div className="px-4 mb-4">
        <h1 className="text-2xl font-black tracking-tight">Stats</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 mb-5 pb-1">
        {(['matchplay', 'strokeplay', 'wagers'] as StatsTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize',
              tab === t ? 'text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}
            style={tab === t ? { backgroundColor: 'oklch(0.29 0.072 160)' } : undefined}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-4">
        {tab === 'matchplay' && profile && <MatchplayStats playerId={profile.id} />}
        {tab === 'strokeplay' && profile && <StrokeplayStats playerId={profile.id} />}
        {tab === 'wagers' && profile && <WagerStats playerId={profile.id} />}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex-1 rounded-xl bg-card border border-border p-4 text-center">
      <p className="text-2xl font-black text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wide">{label}</p>
    </div>
  )
}

function MatchplayStats({ playerId }: { playerId: string }) {
  const { data: allGroups, isLoading: groupsLoading } = useAllGroupStandings()
  const { data: allPlayers = [], isLoading: playersLoading } = usePlayers()

  if (groupsLoading || playersLoading) return <StatsSkeletons />

  let wins = 0, losses = 0, draws = 0, played = 0, totalPoints = 0

  allGroups?.forEach(({ standings }) => {
    const entry = standings.find((s) => s.player.id === playerId)
    if (entry) {
      wins = entry.wins
      losses = entry.losses
      draws = entry.draws
      played = entry.played
      totalPoints = entry.total_points
    }
  })

  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0

  // Form guide (mock last 5)
  const form = ['W', 'D', 'W', 'L', 'W']

  // Leaderboard widgets
  const sortedByPoints = allPlayers
    .map((p) => {
      let pts = 0
      allGroups?.forEach(({ standings }) => {
        const e = standings.find((s) => s.player.id === p.id)
        if (e) pts = e.total_points
      })
      return { player: p, points: pts }
    })
    .sort((a, b) => b.points - a.points)

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex gap-3">
        <StatCard label="Wins" value={wins} />
        <StatCard label="Draws" value={draws} />
        <StatCard label="Losses" value={losses} />
      </div>
      <div className="flex gap-3">
        <StatCard label="Points" value={formatPoints(totalPoints)} sub="incl. bonus" />
        <StatCard label="Win Rate" value={`${winRate}%`} />
        <StatCard label="Played" value={played} />
      </div>

      {/* Form guide */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Form Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {form.map((f, i) => (
              <div
                key={i}
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                style={{
                  backgroundColor:
                    f === 'W' ? 'oklch(0.52 0.17 145)' :
                    f === 'D' ? 'oklch(0.75 0.10 90)' :
                    'oklch(0.55 0.22 25)',
                }}
              >
                {f}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard widget */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Season Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedByPoints.slice(0, 5).map((entry, i) => (
              <div key={entry.player.id} className="flex items-center gap-3">
                <span className={cn(
                  'text-xs font-bold w-4 text-center',
                  i === 0 && 'text-yellow-500',
                  i === 1 && 'text-gray-400',
                  i === 2 && 'text-amber-600',
                )}>
                  {i + 1}
                </span>
                <PlayerAvatar player={entry.player} size="xs" />
                <span className={cn(
                  'flex-1 text-sm',
                  entry.player.id === playerId && 'font-bold'
                )}>
                  {profileDisplayName(entry.player)}
                </span>
                <span className="text-sm font-black" style={{ color: 'oklch(0.91 0.19 106)' }}>
                  {formatPoints(entry.points)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StrokeplayStats({ playerId }: { playerId: string }) {
  const { data: rounds = [], isLoading } = usePlayerRounds(playerId)

  if (isLoading) return <StatsSkeletons />

  const sorted = [...rounds].sort((a, b) => a.net_score - b.net_score)
  const bestNet = sorted[0]?.net_score
  const avgNet = rounds.length > 0
    ? Math.round(rounds.reduce((s, r) => s + r.net_score, 0) / rounds.length)
    : null

  const netTrendData = rounds
    .sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())
    .map((r, i) => ({
      round: i + 1,
      courseHcp: r.course_handicap,
      net: r.net_score,
    }))

  const courses = [...new Set(rounds.map((r) => r.course_name))]

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <StatCard label="Best Net" value={bestNet ?? '—'} />
        <StatCard label="Avg Net" value={avgNet ?? '—'} />
        <StatCard label="Rounds" value={rounds.length} />
      </div>

      {netTrendData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Net Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={netTrendData}>
                <XAxis dataKey="round" tick={{ fontSize: 10 }} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v) => [v, 'Net']}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="oklch(0.42 0.15 260)"
                  strokeWidth={2}
                  dot={{ fill: 'oklch(0.42 0.15 260)', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Rounds Submitted</CardTitle>
        </CardHeader>
        <CardContent>
          {rounds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rounds submitted yet</p>
          ) : (
            <div className="space-y-2">
              {sorted.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{r.course_name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{r.played_at}</span>
                  </div>
                  <div className="flex gap-3 text-right">
                    <span className="text-muted-foreground text-xs">G:{r.gross_score}</span>
                    <span className="font-bold" style={{ color: 'oklch(0.42 0.15 260)' }}>
                      N:{r.net_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {courses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Courses Played</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {courses.map((c) => (
                <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function WagerStats({ playerId }: { playerId: string }) {
  const { data: wagers = [], isLoading } = useWagers(playerId)

  if (isLoading) return <StatsSkeletons />

  const settled = wagers.filter((w) => w.status === 'settled')
  const won = settled.filter((w) => w.result_winner_id === playerId)
  const lost = settled.filter((w) => w.result_winner_id !== playerId)
  const netPL = won.reduce((s, w) => s + w.amount, 0) - lost.reduce((s, w) => s + w.amount, 0)
  const winRate = settled.length > 0 ? Math.round((won.length / settled.length) * 100) : 0
  const biggestWin = won.length > 0 ? Math.max(...won.map((w) => w.amount)) : 0

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <StatCard label="Won" value={won.length} />
        <StatCard label="Lost" value={lost.length} />
        <StatCard label="Win Rate" value={`${winRate}%`} />
      </div>

      <div className="flex gap-3">
        <StatCard
          label="Net P&L"
          value={formatCurrency(netPL, 0)}
        />
        <StatCard label="Biggest Win" value={biggestWin > 0 ? formatWalletBalance(biggestWin) : '—'} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Recent Wagers</CardTitle>
        </CardHeader>
        <CardContent>
          {settled.length === 0 ? (
            <p className="text-sm text-muted-foreground">No settled wagers yet</p>
          ) : (
            <div className="space-y-2">
              {settled.slice(0, 5).map((w) => {
                const isWin = w.result_winner_id === playerId
                const other = w.proposer_id === playerId ? w.opponent : w.proposer
                return (
                  <div key={w.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <PlayerAvatar player={other} size="xs" />
                      <span className="text-sm">{profileDisplayName(other)}</span>
                    </div>
                    <span
                      className="font-bold"
                      style={{ color: isWin ? 'oklch(0.52 0.17 145)' : 'oklch(0.55 0.22 25)' }}
                    >
                      {formatCurrency(isWin ? w.amount : -w.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatsSkeletons() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-20 flex-1 rounded-xl" />
        <Skeleton className="h-20 flex-1 rounded-xl" />
        <Skeleton className="h-20 flex-1 rounded-xl" />
      </div>
      <Skeleton className="h-40 rounded-xl" />
    </div>
  )
}
