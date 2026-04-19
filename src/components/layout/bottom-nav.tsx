import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Home, Trophy, Banknote, User, Flag, Settings, Lock } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const GREEN  = 'oklch(0.22 0.068 157)'
const BORDER = 'oklch(0.30 0.068 157)'
const GOLD   = 'oklch(0.80 0.14 72)'
const GOLD_FG = 'oklch(0.18 0.06 60)'

export function BottomNav() {
  const location   = useLocation()
  const navigate   = useNavigate()
  const openScoreSheet = useUIStore((s) => s.openScoreSheet)
  const activeTourTab  = useUIStore((s) => s.activeTourTab)
  const profile        = useAuthStore((s) => s.profile)

  const [tourToast, setTourToast] = useState(false)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleTourClick = () => {
    if (activeTourTab) {
      navigate('/tour')
    } else {
      setTourToast(true)
      setTimeout(() => setTourToast(false), 2800)
    }
  }

  return (
    <>
      {/* Tour locked toast */}
      <div
        className={cn(
          'fixed left-4 right-4 z-[60] transition-all duration-300 ease-out',
          tourToast
            ? 'bottom-[90px] opacity-100 translate-y-0'
            : 'bottom-[90px] opacity-0 translate-y-2 pointer-events-none',
        )}
      >
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl"
          style={{ backgroundColor: 'oklch(0.17 0.055 157)' }}
        >
          <Lock className="h-4 w-4 shrink-0" style={{ color: GOLD }} />
          <p className="text-sm font-medium text-white/90">
            Tour unlocks when the season goes live. Stay tuned.
          </p>
        </div>
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t safe-bottom"
        style={{ backgroundColor: GREEN, borderTopColor: BORDER }}
      >
        {/* Fixed 58px rail — all items same height, Score pops above */}
        <div className="relative flex h-[58px] items-center justify-around px-1">

          <NavButton icon={<Home className="h-[22px] w-[22px]" />}    label="Home"    active={isActive('/')}       onClick={() => navigate('/')} />
          <NavButton icon={<Trophy className="h-[22px] w-[22px]" />}  label="Bracket" active={isActive('/bracket')} onClick={() => navigate('/bracket')} />

          {/* Centre Score button — circle floats above, label sits flush with others */}
          <div className="relative flex flex-col items-center justify-end h-full min-w-[52px] pb-[7px]">
            <button
              onClick={openScoreSheet}
              className="absolute flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 focus:outline-none"
              style={{
                bottom: 24,
                backgroundColor: GOLD,
                boxShadow: `0 4px 18px oklch(0.80 0.14 72 / 0.55)`,
              }}
              aria-label="Enter Score"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke={GOLD_FG} strokeWidth="2.8" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-[10px] font-semibold text-white/50">Score</span>
          </div>

          <NavButton icon={<Banknote className="h-[22px] w-[22px]" />} label="Wagers" active={isActive('/wagers')} onClick={() => navigate('/wagers')} />

          {/* Last slot: always Tour (locked or live), or Admin for admins */}
          {profile?.is_admin && !activeTourTab ? (
            <NavButton icon={<Settings className="h-[22px] w-[22px]" />} label="Admin" active={isActive('/admin')} onClick={() => navigate('/admin')} />
          ) : (
            <NavButton
              icon={<Flag className="h-[22px] w-[22px]" />}
              label="Tour"
              active={isActive('/tour')}
              locked={!activeTourTab}
              onClick={handleTourClick}
            />
          )}
        </div>
      </nav>
    </>
  )
}

function NavButton({
  icon,
  label,
  active,
  locked = false,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  locked?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-[3px] min-w-[52px] h-full focus:outline-none transition-opacity"
      style={{ opacity: locked ? 0.4 : active ? 1 : 0.55 }}
    >
      <span style={{ color: active ? GOLD : 'white' }}>
        {icon}
      </span>
      <span
        className="text-[10px] font-semibold leading-none"
        style={{ color: active ? GOLD : 'white' }}
      >
        {label}
      </span>
      {locked && (
        <Lock
          className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5"
          style={{ color: GOLD }}
        />
      )}
    </button>
  )
}
