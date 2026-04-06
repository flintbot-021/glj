import { useLocation, useNavigate } from 'react-router'
import { Home, Trophy, Banknote, User, Flag, Settings } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const openScoreSheet = useUIStore((s) => s.openScoreSheet)
  const activeTourTab = useUIStore((s) => s.activeTourTab)
  const currentPlayer = useAuthStore((s) => s.currentPlayer)

  const isActive = (path: string | null) => {
    if (!path) return false
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t safe-bottom"
      style={{
        backgroundColor: 'oklch(0.29 0.072 160)',
        borderTopColor: 'oklch(0.36 0.06 160)',
      }}
    >
      <div className="flex items-end justify-around px-2 pt-2 pb-1">
        {/* Home */}
        <NavButton
          icon={<Home className="h-5 w-5" />}
          label="Home"
          active={isActive('/')}
          onClick={() => navigate('/')}
        />

        {/* Bracket */}
        <NavButton
          icon={<Trophy className="h-5 w-5" />}
          label="Bracket"
          active={isActive('/bracket')}
          onClick={() => navigate('/bracket')}
        />

        {/* Center CTA */}
        <div className="flex flex-col items-center pb-1">
          <button
            onClick={openScoreSheet}
            className="flex h-14 w-14 -mt-5 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 focus:outline-none"
            style={{
              backgroundColor: 'oklch(0.91 0.19 106)',
              boxShadow: '0 4px 14px oklch(0.91 0.19 106 / 0.5)',
            }}
            aria-label="Enter Score"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="oklch(0.20 0.07 150)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
          <span className="mt-1 text-[10px] font-semibold text-white/50">Score</span>
        </div>

        {/* Wagers */}
        <NavButton
          icon={<Banknote className="h-5 w-5" />}
          label="Wagers"
          active={isActive('/wagers')}
          onClick={() => navigate('/wagers')}
        />

        {/* Profile / Tour / Admin */}
        {activeTourTab ? (
          <NavButton
            icon={<Flag className="h-5 w-5" />}
            label="Tour"
            active={isActive('/tour')}
            onClick={() => navigate('/tour')}
          />
        ) : currentPlayer?.is_admin ? (
          <NavButton
            icon={<Settings className="h-5 w-5" />}
            label="Admin"
            active={isActive('/admin')}
            onClick={() => navigate('/admin')}
          />
        ) : (
          <NavButton
            icon={<User className="h-5 w-5" />}
            label="Me"
            active={isActive('/profile')}
            onClick={() => navigate('/profile')}
          />
        )}
      </div>
    </nav>
  )
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-0.5 px-3 py-1 min-w-[44px] transition-colors focus:outline-none',
        active ? 'opacity-100' : 'opacity-50'
      )}
    >
      <span
        style={{ color: active ? 'oklch(0.91 0.19 106)' : 'white' }}
        className="transition-colors"
      >
        {icon}
      </span>
      <span
        className="text-[10px] font-semibold"
        style={{ color: active ? 'oklch(0.91 0.19 106)' : 'white' }}
      >
        {label}
      </span>
    </button>
  )
}
