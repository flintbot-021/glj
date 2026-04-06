import { useNavigate } from 'react-router'
import { useAllGroupStandings, useSubSeasons, useWagers } from '@/hooks/use-data'
import { MATCHPLAY_RESULTS, PLAYERS } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChevronRight, Users, Trophy, DollarSign, Flag, AlertTriangle, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

export function AdminPage() {
  const navigate = useNavigate()
  const currentPlayer = useAuthStore((s) => s.currentPlayer)
  const { data: allGroups } = useAllGroupStandings()
  const { data: subSeasons } = useSubSeasons()
  const { data: wagers = [] } = useWagers()

  if (!currentPlayer?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <p className="text-muted-foreground text-center">
          You need admin privileges to access this section.
        </p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  const openSubSeason = subSeasons?.find((ss) => ss.status === 'open')
  const disputedWagers = wagers.filter((w) => w.status === 'disputed')

  // Total fixtures count
  const totalExpectedFixtures = allGroups?.reduce((sum, { standings }) => {
    const n = standings.length
    return sum + (n * (n - 1)) / 2
  }, 0) ?? 0
  const playedFixtures = MATCHPLAY_RESULTS.length

  return (
    <div className="py-4">
      <div className="px-4 mb-5">
        <h1 className="text-2xl font-black tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">Season management</p>
      </div>

      {/* Health cards */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-5">
        <StatCard
          label="Fixtures Played"
          value={`${playedFixtures}/${totalExpectedFixtures}`}
          sub={`${Math.round((playedFixtures / totalExpectedFixtures) * 100)}% complete`}
          color="oklch(0.29 0.072 160)"
        />
        <StatCard
          label="Active Sub-Season"
          value={openSubSeason?.name ?? 'None'}
          sub={openSubSeason ? 'Open' : 'Closed'}
          color="oklch(0.42 0.15 260)"
        />
        <StatCard
          label="Total Players"
          value={PLAYERS.length}
          sub="17 registered"
          color="oklch(0.52 0.17 145)"
        />
        <StatCard
          label="Disputes"
          value={disputedWagers.length}
          sub={disputedWagers.length > 0 ? 'Needs attention' : 'All clear'}
          color={disputedWagers.length > 0 ? 'oklch(0.55 0.22 25)' : 'oklch(0.52 0.17 145)'}
          highlight={disputedWagers.length > 0}
        />
      </div>

      <Separator className="mb-4" />

      {/* Admin nav links */}
      <div className="px-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Manage</p>

        <AdminLink
          icon={<Users className="h-5 w-5" />}
          label="Players"
          desc="Manage players, wallets, and admin roles"
          path="/admin/players"
          color="oklch(0.29 0.072 160)"
          onClick={() => navigate('/admin/players')}
        />
        <AdminLink
          icon={<Settings className="h-5 w-5" />}
          label="Groups"
          desc="Group assignments and fixture matrix"
          path="/admin/groups"
          color="oklch(0.42 0.15 260)"
          onClick={() => navigate('/admin/groups')}
        />
        <AdminLink
          icon={<Flag className="h-5 w-5" />}
          label="Sub-Seasons"
          desc="Open, close, and manage bonus points"
          path="/admin/sub-seasons"
          color="oklch(0.55 0.12 200)"
          onClick={() => navigate('/admin/sub-seasons')}
        />
        <AdminLink
          icon={<Trophy className="h-5 w-5" />}
          label="Knockout Bracket"
          desc="Set pairings and trigger knockout phase"
          path="/admin/bracket"
          color="oklch(0.60 0.18 330)"
          onClick={() => navigate('/admin/bracket')}
        />
        {disputedWagers.length > 0 && (
          <AdminLink
            icon={<AlertTriangle className="h-5 w-5" />}
            label={`Wager Disputes (${disputedWagers.length})`}
            desc="Resolve disputed wager results"
            path="/admin/disputes"
            color="oklch(0.55 0.22 25)"
            onClick={() => navigate('/admin/disputes')}
          />
        )}
        <AdminLink
          icon={<DollarSign className="h-5 w-5" />}
          label="Wager Disputes"
          desc="All pending dispute resolutions"
          path="/admin/disputes"
          color="oklch(0.65 0.18 50)"
          onClick={() => navigate('/admin/disputes')}
        />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  color,
  highlight = false,
}: {
  label: string
  value: string | number
  sub?: string
  color: string
  highlight?: boolean
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: highlight ? `${color}15` : 'var(--card)',
        border: `1px solid ${highlight ? color : 'var(--border)'}`,
      }}
    >
      <p
        className="text-2xl font-black"
        style={{ color: highlight ? color : 'var(--foreground)' }}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

function AdminLink({
  icon,
  label,
  desc,
  color,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  desc: string
  path: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card active:scale-[0.99] transition-transform text-left hover:border-primary/30"
    >
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  )
}
