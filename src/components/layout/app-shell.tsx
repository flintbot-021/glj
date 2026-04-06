import { Outlet } from 'react-router'
import { Header } from './header'
import { BottomNav } from './bottom-nav'
import { ScoreEntrySheet } from '@/components/scores/score-entry-sheet'
import { NotificationCenter } from '@/components/notifications/notification-center'

export function AppShell() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />

      {/* Main scrollable area */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <BottomNav />
      <ScoreEntrySheet />
      <NotificationCenter />
    </div>
  )
}
