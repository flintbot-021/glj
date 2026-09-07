/** Tuesday 8 Sep 2026 19:00 SAST (UTC+2). */
export const TOUR_PUBLIC_AT_MS = Date.parse('2026-09-08T17:00:00.000Z')

/** Early access before the public gate. */
export const TOUR_PREVIEW_EMAILS = ['kdbar17@gmail.com', 'rmbminnaar@gmail.com'] as const

export function canSeeTour(email: string | null | undefined, nowMs = Date.now()): boolean {
  if (nowMs >= TOUR_PUBLIC_AT_MS) return true
  const normalized = email?.trim().toLowerCase()
  if (!normalized) return false
  return TOUR_PREVIEW_EMAILS.some((e) => e === normalized)
}
