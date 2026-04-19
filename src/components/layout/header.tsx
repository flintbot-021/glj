import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { useUnreadCount } from '@/hooks/use-data'
import { formatWalletBalance } from '@/lib/format'
import { useNavigate } from 'react-router'

const GREEN      = 'oklch(0.22 0.068 157)'
const GREEN_DARK = 'oklch(0.17 0.055 157)'
const GOLD       = 'oklch(0.80 0.14 72)'
const GOLD_FG    = 'oklch(0.18 0.06 60)'

export function Header() {
  const profile          = useAuthStore((s) => s.profile)
  const openNotifications = useUIStore((s) => s.openNotifications)
  const navigate         = useNavigate()
  const { data: unreadCount = 0 } = useUnreadCount(profile?.id ?? '')

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 pb-3 safe-top"
      style={{ backgroundColor: GREEN }}
    >
      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex min-h-10 flex-col items-start justify-center gap-0 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 leading-none">
          Road to
        </span>
        <span
          className="rtd-display text-[26px] leading-none tracking-[0.06em]"
          style={{ color: GOLD }}
        >
          DIAS
        </span>
      </button>

      <div className="flex items-center gap-2">
        {profile && (
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ backgroundColor: GREEN_DARK }}
          >
            <span className="text-[11px] font-medium uppercase tracking-wide text-white/55">Wallet</span>
            <span className="num text-sm font-semibold" style={{ color: GOLD }}>
              {formatWalletBalance(profile.wallet_balance)}
            </span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-white hover:bg-white/10"
          onClick={openNotifications}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-0.5 -right-0.5 h-4 w-4 min-w-0 p-0 flex items-center justify-center text-[10px] font-bold border-0"
              style={{ backgroundColor: GOLD, color: GOLD_FG }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  )
}
