import { useNavigate } from 'react-router'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useNotifications, useMarkNotificationRead } from '@/hooks/use-data'
import { formatRelativeTime } from '@/lib/format'
import { Bell, Trophy, DollarSign, Flag, Star } from 'lucide-react'
import type { NotificationType } from '@/lib/types'
import { cn } from '@/lib/utils'

const NOTIF_ICONS: Record<NotificationType, React.ReactNode> = {
  wager_request: <DollarSign className="h-4 w-4" />,
  wager_accepted: <DollarSign className="h-4 w-4" />,
  wager_declined: <DollarSign className="h-4 w-4" />,
  wager_result: <DollarSign className="h-4 w-4" />,
  wager_confirmed: <DollarSign className="h-4 w-4" />,
  wager_disputed: <DollarSign className="h-4 w-4" />,
  matchplay_result: <Trophy className="h-4 w-4" />,
  sub_season_closed: <Star className="h-4 w-4" />,
  bracket_set: <Trophy className="h-4 w-4" />,
  tour_update: <Flag className="h-4 w-4" />,
}

const NOTIF_ROUTES: Record<NotificationType, string> = {
  wager_request: '/wagers',
  wager_accepted: '/wagers',
  wager_declined: '/wagers',
  wager_result: '/wagers',
  wager_confirmed: '/wagers',
  wager_disputed: '/wagers',
  matchplay_result: '/',
  sub_season_closed: '/',
  bracket_set: '/bracket',
  tour_update: '/tour',
}

const NOTIF_COLORS: Record<NotificationType, string> = {
  wager_request: 'oklch(0.65 0.18 50)',
  wager_accepted: 'oklch(0.52 0.17 145)',
  wager_declined: 'oklch(0.55 0.22 25)',
  wager_result: 'oklch(0.65 0.18 50)',
  wager_confirmed: 'oklch(0.52 0.17 145)',
  wager_disputed: 'oklch(0.55 0.22 25)',
  matchplay_result: 'oklch(0.22 0.068 157)',
  sub_season_closed: 'oklch(0.80 0.14 72)',
  bracket_set: 'oklch(0.60 0.18 330)',
  tour_update: 'oklch(0.42 0.15 260)',
}

export function NotificationCenter() {
  const open = useUIStore((s) => s.notificationsOpen)
  const close = useUIStore((s) => s.closeNotifications)
  const profile = useAuthStore((s) => s.profile)
  const { data: notifications = [] } = useNotifications(profile?.id ?? '')
  const markRead = useMarkNotificationRead()
  const navigate = useNavigate()

  return (
    <Sheet open={open} onOpenChange={(v) => !v && close()}>
      <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col">
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <Bell className="h-10 w-10 text-muted-foreground/30" />
              <p className="font-semibold text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  className={cn(
                    'w-full flex items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/50',
                    !notif.is_read && 'bg-primary/3'
                  )}
                  onClick={() => {
                    if (!profile) return
                    markRead.mutate({ notificationId: notif.id, playerId: profile.id })
                    navigate(NOTIF_ROUTES[notif.type])
                    close()
                  }}
                >
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                    style={{ backgroundColor: NOTIF_COLORS[notif.type] }}
                  >
                    {NOTIF_ICONS[notif.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm leading-snug', !notif.is_read && 'font-semibold')}>
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatRelativeTime(notif.created_at)}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: 'oklch(0.42 0.15 260)' }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
