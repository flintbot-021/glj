import { create } from 'zustand'

interface UIState {
  scoreSheetOpen: boolean
  openScoreSheet: () => void
  closeScoreSheet: () => void

  activeTourTab: boolean
  setActiveTourTab: (active: boolean) => void

  notificationsOpen: boolean
  openNotifications: () => void
  closeNotifications: () => void
}

export const useUIStore = create<UIState>((set) => ({
  scoreSheetOpen: false,
  openScoreSheet: () => set({ scoreSheetOpen: true }),
  closeScoreSheet: () => set({ scoreSheetOpen: false }),

  activeTourTab: true, // Tour is active (event in progress)
  setActiveTourTab: (active) => set({ activeTourTab: active }),

  notificationsOpen: false,
  openNotifications: () => set({ notificationsOpen: true }),
  closeNotifications: () => set({ notificationsOpen: false }),
}))
