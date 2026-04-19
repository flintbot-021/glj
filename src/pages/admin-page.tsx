import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ChevronRight, Flag, MapPin } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'

export function AdminPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)

  if (!profile?.is_admin) {
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

  return (
    <div className="py-4">
      <div className="px-4 mb-5">
        <h1 className="text-2xl font-black tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">Choose a management area</p>
      </div>

      <div className="px-4 space-y-3">
        <button
          type="button"
          onClick={() => navigate('/admin/rtd')}
          className="w-full flex items-center gap-4 p-5 rounded-2xl border border-border bg-card text-left active:scale-[0.99] transition-transform hover:border-primary/20"
        >
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
            style={{ backgroundColor: 'oklch(0.29 0.072 160)' }}
          >
            <Flag className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base">Road to Dias</p>
            <p className="text-sm text-muted-foreground leading-snug mt-0.5">
              Season &amp; bonus legs, groups, stroke ladder awards, players, bracket
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/tour')}
          className="w-full flex items-center gap-4 p-5 rounded-2xl border border-border bg-card text-left active:scale-[0.99] transition-transform hover:border-primary/20"
        >
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
            style={{ backgroundColor: 'oklch(0.42 0.15 260)' }}
          >
            <MapPin className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base">Tour</p>
            <p className="text-sm text-muted-foreground leading-snug mt-0.5">
              Courses, tour days, matches, day handicaps, live scoring setup
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </button>
      </div>
    </div>
  )
}
