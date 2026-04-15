import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
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
    <div className="py-4 px-4">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Tour</h1>
          <p className="text-sm text-muted-foreground">Adare Manor tour tools — coming next</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        This area will hold tour-specific admin: days, formats, team draws, hole overrides, and live scoring
        policies. Road to Dias (match play + stroke bonus) is under <strong>Admin → RTD</strong>.
      </p>
    </div>
  )
}
