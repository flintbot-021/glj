import { Navigate, Outlet } from 'react-router'
import { useAuthStore } from '@/stores/auth-store'
import { canSeeTour } from '@/lib/tour-preview'

export function RequireTour() {
  const profile = useAuthStore((s) => s.profile)
  if (!canSeeTour(profile?.email)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
