import { useAllGroupStandings, useWalletTransactions, usePlayerRounds } from '@/hooks/use-data'
import { useAuthStore } from '@/stores/auth-store'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useNavigate } from 'react-router'
import { formatPoints, formatCurrency, formatDate, formatWalletBalance, profileDisplayName } from '@/lib/format'
import type { GroupStanding } from '@/lib/types'

export function ProfilePage() {
  const profile = useAuthStore((s) => s.profile)
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()

  const { data: allGroups } = useAllGroupStandings()
  const { data: transactions = [], isLoading: txLoading } = useWalletTransactions(profile?.id ?? '')
  const { data: rounds = [] } = usePlayerRounds(profile?.id ?? '')

  if (!profile) return null

  const groupStanding = allGroups?.reduce<{
    total_points: number
    wins: number
    losses: number
    draws: number
    position: number
    group_name: string
  } | null>((found, { group, standings }) => {
    if (found) return found
    const entry = standings.find((s) => s.player.id === profile.id) as GroupStanding | undefined
    if (!entry) return null
    const pos = standings.indexOf(entry) + 1
    return {
      total_points: entry.total_points,
      wins: entry.wins,
      losses: entry.losses,
      draws: entry.draws,
      position: pos,
      group_name: group.name,
    }
  }, null) ?? null

  return (
    <div className="py-4">
      {/* Profile header */}
      <div className="px-4 mb-5">
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'oklch(0.29 0.072 160)' }}
        >
          <div className="flex items-center gap-4 mb-4">
            <PlayerAvatar player={profile} size="xl" />
            <div>
              <h1 className="text-2xl font-black text-white">{profileDisplayName(profile)}</h1>
              {profile.full_name && (
                <p className="text-sm text-white/60">{profile.display_name}</p>
              )}
              {profile.is_admin && (
                <Badge className="mt-1 text-[10px] border-0 bg-white/20 text-white">Admin</Badge>
              )}
            </div>
          </div>

          {/* Stats row */}
          {groupStanding && (
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-xl" style={{ backgroundColor: 'oklch(0.23 0.06 160)' }}>
                <p className="text-xl font-black" style={{ color: 'oklch(0.91 0.19 106)' }}>
                  {formatPoints(groupStanding.total_points)}
                </p>
                <p className="text-[10px] text-white/50 uppercase tracking-wide mt-0.5">Points</p>
              </div>
              <div className="text-center p-2 rounded-xl" style={{ backgroundColor: 'oklch(0.23 0.06 160)' }}>
                <p className="text-xl font-black text-white">
                  {groupStanding.wins}-{groupStanding.losses}-{groupStanding.draws}
                </p>
                <p className="text-[10px] text-white/50 uppercase tracking-wide mt-0.5">W-L-D</p>
              </div>
              <div className="text-center p-2 rounded-xl" style={{ backgroundColor: 'oklch(0.23 0.06 160)' }}>
                <p className="text-xl font-black text-white">#{groupStanding.position}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wide mt-0.5">{groupStanding.group_name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wallet */}
      <div className="px-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">Wallet</CardTitle>
              <span className="text-xl font-black" style={{ color: 'oklch(0.65 0.18 50)' }}>
                {formatWalletBalance(profile.wallet_balance)}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 rounded" />
                <Skeleton className="h-10 rounded" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium capitalize">{tx.type.replace(/_/g, ' ')}</p>
                      {tx.note && <p className="text-xs text-muted-foreground">{tx.note}</p>}
                      <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                    </div>
                    <span
                      className="font-bold"
                      style={{ color: tx.amount > 0 ? 'oklch(0.52 0.17 145)' : 'oklch(0.55 0.22 25)' }}
                    >
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent rounds */}
      {rounds.length > 0 && (
        <div className="px-4 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Recent Rounds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rounds.slice(0, 4).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{r.course_name}</p>
                      <p className="text-xs text-muted-foreground">{r.played_at}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm" style={{ color: 'oklch(0.42 0.15 260)' }}>
                        Net {r.net_score}
                      </span>
                      <p className="text-xs text-muted-foreground">G:{r.gross_score}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator className="mx-4" />

      <div className="px-4 mt-4 space-y-2">
        {profile.is_admin && (
          <Button className="w-full" variant="outline" onClick={() => navigate('/admin')}>
            Admin Dashboard
          </Button>
        )}
        <Button className="w-full" variant="ghost" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  )
}
