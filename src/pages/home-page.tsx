import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GroupStandings } from '@/components/home/group-standings'
import { BonusLeague } from '@/components/home/bonus-league'
import { ActivityFeed } from '@/components/home/activity-feed'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { useUnreadCount } from '@/hooks/use-data'
import { formatWalletBalance } from '@/lib/format'
import { cn } from '@/lib/utils'

type Tab = 'groups' | 'bonus'

const GREEN      = 'oklch(0.22 0.068 157)'
const GREEN_DARK = 'oklch(0.17 0.055 157)'
const GOLD       = 'oklch(0.80 0.14 72)'
const GOLD_FG    = 'oklch(0.18 0.06 60)'

// Height of the full hero block (below the top bar)
const HERO_COLLAPSE_THRESHOLD = 160

export function HomePage() {
  const [tab, setTab]           = useState<Tab>('groups')
  const [scrolled, setScrolled] = useState(false)
  const sentinelRef             = useRef<HTMLDivElement>(null)

  const profile          = useAuthStore((s) => s.profile)
  const openNotifications = useUIStore((s) => s.openNotifications)
  const { data: unreadCount = 0 } = useUnreadCount(profile?.id ?? '')

  const heroContentRef = useRef<HTMLDivElement>(null)

  // Scroll: collapse threshold + parallax on hero content
  const handleScroll = useCallback(() => {
    const el = document.getElementById('app-scroll')
    if (!el) return
    const y = el.scrollTop
    setScrolled(y > HERO_COLLAPSE_THRESHOLD)
    // Parallax: hero content moves up at 0.45× scroll speed
    if (heroContentRef.current) {
      heroContentRef.current.style.transform = `translateY(${y * 0.45}px)`
      heroContentRef.current.style.opacity = String(Math.max(0, 1 - y / 140))
    }
  }, [])

  useEffect(() => {
    const el = document.getElementById('app-scroll')
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <div>
      {/* ── HERO (scrolls away naturally) ───────────────────────────────── */}
      <div
        className="relative flex flex-col items-center pb-2"
        style={{ backgroundColor: GREEN }}
      >
        {/* Top bar — wallet + bell */}
        <div className="safe-top w-full flex items-center justify-between px-4 pt-3 pb-1">
          {profile && (
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ backgroundColor: GREEN_DARK }}
            >
              <span className="text-[11px] font-medium uppercase tracking-wide text-white/55">
                Wallet
              </span>
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

        {/* Brand centrepiece — parallax layer */}
        <div
          ref={heroContentRef}
          className="flex flex-col items-center gap-1 py-14 will-change-transform"
          style={{ pointerEvents: 'none' }}
        >
          <h1
            className="rtd-display rtd-stamp text-[88px] leading-none tracking-[0.06em] text-white"
          >
            RTD
          </h1>
          <span className="rtd-display text-[13px] tracking-[0.32em] text-white/45 uppercase">
            Road to Dias
          </span>
        </div>
      </div>

      {/* ── STICKY: compact bar + tabs ──────────────────────────────────── */}
      <div
        className="sticky top-0 z-30"
        style={{ backgroundColor: GREEN }}
      >
        {/* Compact collapsed header — slides in once scrolled past hero */}
        <div
          className={cn(
            'flex items-center justify-between px-4 overflow-hidden transition-all duration-300 ease-out',
            scrolled ? 'max-h-12 opacity-100 py-1' : 'max-h-0 opacity-0 py-0',
          )}
          style={{ backgroundColor: GREEN }}
        >
          <span
            className="rtd-display text-[26px] leading-none tracking-[0.06em]"
            style={{ color: GOLD }}
          >
            ROAD TO DIAS
          </span>

          <div className="flex items-center gap-3">
            {profile && (
              <span className="num text-sm font-semibold" style={{ color: GOLD }}>
                {formatWalletBalance(profile.wallet_balance)}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 text-white hover:bg-white/10"
              onClick={openNotifications}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{ backgroundColor: GOLD, color: GOLD_FG }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Tab bar — always visible in sticky */}
        <div className="flex gap-1 px-3 pt-2 pb-2">
          {(['groups', 'bonus'] as const).map((t) => {
            const active = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 rounded-lg py-2.5 text-[13px] font-bold uppercase tracking-widest transition-all duration-200',
                  active ? 'shadow-sm' : 'text-white/45 hover:text-white/70',
                )}
                style={
                  active
                    ? { backgroundColor: GOLD, color: GOLD_FG }
                    : undefined
                }
              >
                {t === 'groups' ? 'Groups' : 'Bonus'}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div ref={sentinelRef} className="pt-4 pb-2">
        {tab === 'groups' ? <GroupStandings /> : <BonusLeague />}
      </div>

      <div className="mx-4 my-4 h-px" style={{ backgroundColor: 'oklch(0.90 0.01 157)' }} />

      <ActivityFeed />
    </div>
  )
}
