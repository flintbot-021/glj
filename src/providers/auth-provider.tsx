import { useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getProfile } from '@/lib/supabase/api'
import { useAuthStore } from '@/stores/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSessionState = useAuthStore((s) => s.setSessionState)

  useEffect(() => {
    let cancelled = false

    const applySession = async (session: Session | null) => {
      if (!session?.user) {
        if (!cancelled) setSessionState(null, null, false)
        return
      }
      try {
        const profile = await getProfile(session.user.id)
        if (!cancelled) setSessionState(session, profile, false)
      } catch {
        if (!cancelled) setSessionState(session, null, false)
      }
    }

    setSessionState(null, null, true)
    supabase.auth.getSession().then(({ data: { session } }) => {
      void applySession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [setSessionState])

  return children
}
