import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { QueryProvider } from '@/providers/query-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RequireAuth } from '@/components/auth/require-auth'
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
import { AdminRtdPage } from '@/pages/admin-rtd-page'
import { AdminTourPage } from '@/pages/admin-tour-page'
import { AdminTourEventPage } from '@/pages/admin-tour-event-page'
import { AdminTourRosterPage } from '@/pages/admin-tour-roster-page'
import { AdminTourCoursesPage } from '@/pages/admin-tour-courses-page'
import { AdminTourCourseHolesPage } from '@/pages/admin-tour-course-holes-page'
import { AdminTourFormatsPage } from '@/pages/admin-tour-formats-page'
import { AdminTourDaysPage } from '@/pages/admin-tour-days-page'
import { AdminTourHandicapsPage } from '@/pages/admin-tour-handicaps-page'
import { AdminTourMatchesPage } from '@/pages/admin-tour-matches-page'
import { AdminRtdSeasonPage } from '@/pages/admin-rtd-season-page'
import { AdminRtdGroupsPage } from '@/pages/admin-rtd-groups-page'
import { AdminRtdBonusPage } from '@/pages/admin-rtd-bonus-page'
import { AdminPlayersPage } from '@/pages/admin-players-page'
import { AdminRtdKnockoutPage } from '@/pages/admin-rtd-knockout-page'
import { AuthPage } from '@/pages/auth-page'

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />

              <Route element={<RequireAuth />}>
                <Route path="/tour/scoring/:matchId" element={<TourScoringPage />} />

                <Route element={<AppShell />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/bracket" element={<BracketPage />} />
                  <Route path="/wagers" element={<WagersPage />} />
                  <Route path="/stats" element={<StatsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />

                  <Route path="/tour" element={<TourPage />} />
                  <Route path="/tour/day/:dayNumber" element={<TourDayPage />} />
                  <Route path="/tour/green-jacket" element={<TourGreenJacketPage />} />
                  <Route path="/tour/chumps" element={<TourChumpsPage />} />

                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/rtd" element={<AdminRtdPage />} />
                  <Route path="/admin/tour" element={<AdminTourPage />} />
                  <Route path="/admin/tour/event" element={<AdminTourEventPage />} />
                  <Route path="/admin/tour/roster" element={<AdminTourRosterPage />} />
                  <Route path="/admin/tour/courses" element={<AdminTourCoursesPage />} />
                  <Route path="/admin/tour/courses/:courseId/holes" element={<AdminTourCourseHolesPage />} />
                  <Route path="/admin/tour/formats" element={<AdminTourFormatsPage />} />
                  <Route path="/admin/tour/days" element={<AdminTourDaysPage />} />
                  <Route path="/admin/tour/handicaps" element={<AdminTourHandicapsPage />} />
                  <Route path="/admin/tour/matches" element={<AdminTourMatchesPage />} />
                  <Route path="/admin/rtd/season" element={<AdminRtdSeasonPage />} />
                  <Route path="/admin/rtd/groups" element={<AdminRtdGroupsPage />} />
                  <Route path="/admin/rtd/bonus" element={<AdminRtdBonusPage />} />
                  <Route path="/admin/rtd/players" element={<AdminPlayersPage />} />
                  <Route path="/admin/rtd/knockout" element={<AdminRtdKnockoutPage />} />
                  <Route path="/admin/players" element={<Navigate to="/admin/rtd/players" replace />} />
                  <Route path="/admin/sub-seasons" element={<Navigate to="/admin/rtd/season" replace />} />
                  <Route path="/admin/disputes" element={<Navigate to="/admin/rtd" replace />} />
                  <Route path="/admin/rtd/disputes" element={<Navigate to="/admin/rtd" replace />} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
