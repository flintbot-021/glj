import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { getProfile } from '@/lib/supabase/api'

interface AuthState {
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  /** Hydrates from AuthProvider — do not call from components directly. */
  setSessionState: (session: Session | null, profile: Profile | null, loading: boolean) => void
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,
  setSessionState: (session, profile, isLoading) => set({ session, profile, isLoading }),
  refreshProfile: async () => {
    const uid = get().session?.user?.id
    if (!uid) return
    const profile = await getProfile(uid)
    set({ profile })
  },
  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null, isLoading: false })
  },
}))
