import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Flag,
  MapPin,
  Percent,
  SlidersHorizontal,
  Trophy,
  Users,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

export function AdminTourPage() {
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
          <h1 className="text-2xl font-black tracking-tight">Tour</h1>
          <p className="text-sm text-muted-foreground">Adare Manor — courses, days, matches, handicaps</p>
        </div>
      </div>

      <div className="px-4 space-y-2">
        <AdminTourLink
          icon={<Flag className="h-5 w-5" />}
          label="Tour event"
          desc="Name, status, target points"
          color="oklch(0.42 0.15 260)"
          onClick={() => navigate('/admin/tour/event')}
        />
        <AdminTourLink
          icon={<Users className="h-5 w-5" />}
          label="Roster"
          desc="Teams, seeds, locked handicaps"
          color="oklch(0.52 0.17 145)"
          onClick={() => navigate('/admin/tour/roster')}
        />
        <AdminTourLink
          icon={<MapPin className="h-5 w-5" />}
          label="Courses"
          desc="Course list and yardage / par per hole"
          color="oklch(0.22 0.068 157)"
          onClick={() => navigate('/admin/tour/courses')}
        />
        <AdminTourLink
          icon={<SlidersHorizontal className="h-5 w-5" />}
          label="Formats"
          desc="Scoring format templates (JSON rules)"
          color="oklch(0.55 0.12 200)"
          onClick={() => navigate('/admin/tour/formats')}
        />
        <AdminTourLink
          icon={<Calendar className="h-5 w-5" />}
          label="Days"
          desc="Which course and format per day"
          color="oklch(0.65 0.14 75)"
          onClick={() => navigate('/admin/tour/days')}
        />
        <AdminTourLink
          icon={<Percent className="h-5 w-5" />}
          label="Day handicaps"
          desc="Playing handicap overrides per day"
          color="oklch(0.48 0.14 310)"
          onClick={() => navigate('/admin/tour/handicaps')}
        />
        <AdminTourLink
          icon={<Trophy className="h-5 w-5" />}
          label="Matches"
          desc="Lineups, status, team points"
          color="oklch(0.80 0.14 72)"
          onClick={() => navigate('/admin/tour/matches')}
        />
      </div>

      <p className="px-4 mt-6 text-xs text-muted-foreground leading-relaxed">
        Season-long Road to Dias tools stay under <strong>Admin → RTD</strong>.
      </p>
    </div>
  )
}

function AdminTourLink({
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
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </button>
  )
}
