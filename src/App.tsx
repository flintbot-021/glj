import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryProvider } from '@/providers/query-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell } from '@/components/layout/app-shell'
import { HomePage } from '@/pages/home-page'
import { BracketPage } from '@/pages/bracket-page'
import { WagersPage } from '@/pages/wagers-page'
import { StatsPage } from '@/pages/stats-page'
import { ProfilePage } from '@/pages/profile-page'
import { TourPage } from '@/pages/tour-page'
import { TourDayPage } from '@/pages/tour-day-page'
import { TourScoringPage } from '@/pages/tour-scoring-page'
import { TourGreenJacketPage } from '@/pages/tour-green-jacket-page'
import { TourChumpsPage } from '@/pages/tour-chumps-page'
import { AdminPage } from '@/pages/admin-page'
import { AdminPlayersPage } from '@/pages/admin-players-page'
import { AdminSubSeasonsPage } from '@/pages/admin-sub-seasons-page'
import { AdminDisputesPage } from '@/pages/admin-disputes-page'
import { AuthPage } from '@/pages/auth-page'

export function App() {
  return (
    <QueryProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Tour scoring — full screen, no shell */}
            <Route path="/tour/scoring/:matchId" element={<TourScoringPage />} />

            {/* Main app with shell */}
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/bracket" element={<BracketPage />} />
              <Route path="/wagers" element={<WagersPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Tour */}
              <Route path="/tour" element={<TourPage />} />
              <Route path="/tour/day/:dayNumber" element={<TourDayPage />} />
              <Route path="/tour/green-jacket" element={<TourGreenJacketPage />} />
              <Route path="/tour/chumps" element={<TourChumpsPage />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/players" element={<AdminPlayersPage />} />
              <Route path="/admin/sub-seasons" element={<AdminSubSeasonsPage />} />
              <Route path="/admin/disputes" element={<AdminDisputesPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryProvider>
  )
}
