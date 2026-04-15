import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'

export function RequireAuth() {
  const isLoading = useAuthStore((s) => s.isLoading)
  const profile = useAuthStore((s) => s.profile)

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!profile) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}
