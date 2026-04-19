import { Outlet, useLocation } from 'react-router'
import { Header } from './header'
import { BottomNav } from './bottom-nav'
import { ScoreEntrySheet } from '@/components/scores/score-entry-sheet'
import { NotificationCenter } from '@/components/notifications/notification-center'

export function AppShell() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Header is embedded in the home page hero — skip it there */}
      {!isHome && <Header />}

      {/* id="app-scroll" lets child pages attach scroll listeners */}
      <main id="app-scroll" className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <BottomNav />
      <ScoreEntrySheet />
      <NotificationCenter />
    </div>
  )
}
