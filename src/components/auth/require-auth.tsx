import { useState } from 'react'
import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'
import { SplashScreen } from '@/components/splash-screen'

export function RequireAuth() {
  const isLoading = useAuthStore((s) => s.isLoading)
  const profile   = useAuthStore((s) => s.profile)

  // Show splash once per session (resets on page reload)
  const [splashDone, setSplashDone] = useState(false)

  // Auth still resolving — blank while we wait (no flash of wrong state)
  if (isLoading) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ backgroundColor: 'oklch(0.22 0.068 157)' }}
      />
    )
  }

  if (!profile) {
    return <Navigate to="/auth" replace />
  }

  if (!splashDone) {
    return <SplashScreen onContinue={() => setSplashDone(true)} />
  }

  return <Outlet />
}
