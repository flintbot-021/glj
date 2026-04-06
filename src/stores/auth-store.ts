import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '@/lib/types'
import { PLAYERS } from '@/lib/mock-data'

interface AuthState {
  currentPlayer: Profile | null
  isAuthenticated: boolean
  setCurrentPlayer: (player: Profile) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Default to first player (Conor - admin) for development
      currentPlayer: PLAYERS[0],
      isAuthenticated: true,
      setCurrentPlayer: (player) => set({ currentPlayer: player, isAuthenticated: true }),
      logout: () => set({ currentPlayer: null, isAuthenticated: false }),
    }),
    { name: 'rtd-auth' }
  )
)
