import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Star, Trophy, Users } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

export function AdminRtdPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)

  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="px-4 mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Road to Dias</h1>
          <p className="text-sm text-muted-foreground">Season, groups, stroke bonus</p>
        </div>
      </div>

      <div className="px-4 space-y-2">
        <AdminRtdLink
          icon={<CalendarDays className="h-5 w-5" />}
          label="Season & bonus legs"
          desc="Main season dates, stroke-play windows, bonus point values"
          color="oklch(0.29 0.072 160)"
          onClick={() => navigate('/admin/rtd/season')}
        />
        <AdminRtdLink
          icon={<Users className="h-5 w-5" />}
          label="Groups"
          desc="Move players between match-play groups"
          color="oklch(0.42 0.15 260)"
          onClick={() => navigate('/admin/rtd/groups')}
        />
        <AdminRtdLink
          icon={<Star className="h-5 w-5" />}
          label="Close bonus leg & assign points"
          desc="Confirm top 3, record awards, open the next leg"
          color="oklch(0.91 0.19 106)"
          onClick={() => navigate('/admin/rtd/bonus')}
        />
        <AdminRtdLink
          icon={<Users className="h-5 w-5" />}
          label="Players"
          desc="Wallets, admin credits, roles"
          color="oklch(0.52 0.17 145)"
          onClick={() => navigate('/admin/rtd/players')}
        />
        <AdminRtdLink
          icon={<Trophy className="h-5 w-5" />}
          label="Knockout matchups"
          desc="Set draw pairings and results (public bracket follows progress)"
          color="oklch(0.60 0.18 330)"
          onClick={() => navigate('/admin/rtd/knockout')}
        />
      </div>
    </div>
  )
}

function AdminRtdLink({
  icon,
  label,
  desc,
  color,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  desc: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
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
