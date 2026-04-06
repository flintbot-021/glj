import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { useUnreadCount } from '@/hooks/use-data'
import { formatWalletBalance } from '@/lib/format'
import { useNavigate } from 'react-router'

export function Header() {
  const currentPlayer = useAuthStore((s) => s.currentPlayer)
  const openNotifications = useUIStore((s) => s.openNotifications)
  const navigate = useNavigate()
  const { data: unreadCount = 0 } = useUnreadCount(currentPlayer?.id ?? '')

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 safe-top"
      style={{ backgroundColor: 'oklch(0.29 0.072 160)' }}
    >
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex flex-col leading-none"
      >
        <span className="text-xs font-medium tracking-widest uppercase text-white/60">
          Road To
        </span>
        <span
          className="text-xl font-black tracking-tight uppercase"
          style={{ color: 'oklch(0.91 0.19 106)', fontFamily: "'DM Serif Display', serif" }}
        >
          Dias
        </span>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {currentPlayer && (
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ backgroundColor: 'oklch(0.23 0.06 160)' }}
          >
            <span className="text-xs font-medium text-white/70">Wallet</span>
            <span className="text-sm font-bold" style={{ color: 'oklch(0.91 0.19 106)' }}>
              {formatWalletBalance(currentPlayer.wallet_balance)}
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
