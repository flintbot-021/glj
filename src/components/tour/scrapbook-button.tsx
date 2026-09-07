import { Images } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { useTourEvent, useTourScrapbook } from '@/hooks/use-data'
import { canSeeTour } from '@/lib/tour-preview'
import { TOUR_GOLD, TOUR_GOLD_FG } from '@/lib/tour-colors'
import { cn } from '@/lib/utils'

export function ScrapbookButton({ className }: { className?: string }) {
  const profile = useAuthStore((s) => s.profile)
  const open = useUIStore((s) => s.openScrapbook)
  const { data: ev } = useTourEvent()
  const { data } = useTourScrapbook(canSeeTour(profile?.email) ? ev?.id : undefined)
  if (!canSeeTour(profile?.email)) return null
  const n = data?.entries.length ?? 0

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('relative h-9 w-9 text-white hover:bg-white/10', className)}
      onClick={open}
      aria-label="Scrapbook"
    >
      <Images className="h-5 w-5" />
      {n > 0 ? (
        <Badge
          className="absolute -top-0.5 -right-0.5 h-4 w-4 min-w-0 p-0 flex items-center justify-center text-[10px] font-bold border-0"
          style={{ backgroundColor: TOUR_GOLD, color: TOUR_GOLD_FG }}
        >
          {n > 9 ? '9+' : n}
        </Badge>
      ) : null}
    </Button>
  )
}
