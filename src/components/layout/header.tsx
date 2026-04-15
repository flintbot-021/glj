import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { useUnreadCount } from '@/hooks/use-data'
import { formatWalletBalance } from '@/lib/format'
import { useNavigate } from 'react-router'

export function Header() {
  const profile = useAuthStore((s) => s.profile)
  const openNotifications = useUIStore((s) => s.openNotifications)
  const navigate = useNavigate()
  const { data: unreadCount = 0 } = useUnreadCount(profile?.id ?? '')

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 pb-3 safe-top"
      style={{ backgroundColor: 'oklch(0.29 0.072 160)' }}
    >
      {/* Logo — single family + shared left edge; avoid widest/tight tracking clash */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex min-h-10 flex-col items-start justify-center gap-0.5 py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[oklch(0.29_0.072_160)]"
      >
        <span className="font-sans text-[10px] font-semibold uppercase leading-none tracking-[0.14em] text-white/65">
          Road to
        </span>
        <span
          className="font-sans text-xl font-black uppercase leading-none tracking-[0.02em]"
          style={{ color: 'oklch(0.91 0.19 106)' }}
        >
          Dias
        </span>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {profile && (
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ backgroundColor: 'oklch(0.23 0.06 160)' }}
          >
            <span className="text-xs font-medium text-white/70">Wallet</span>
            <span className="text-sm font-bold" style={{ color: 'oklch(0.91 0.19 106)' }}>
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
              style={{ backgroundColor: 'oklch(0.91 0.19 106)', color: 'oklch(0.20 0.07 150)' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  )
}
