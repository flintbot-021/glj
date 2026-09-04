/** Monday 7 Sep 2026 09:00 SAST (UTC+2). */
export const TOUR_PUBLIC_AT_MS = Date.parse('2026-09-07T07:00:00.000Z')
export const TOUR_PREVIEW_EMAIL = 'kdbar17@gmail.com'

export function canSeeTour(email: string | null | undefined, nowMs = Date.now()): boolean {
  if (nowMs >= TOUR_PUBLIC_AT_MS) return true
  return email?.trim().toLowerCase() === TOUR_PREVIEW_EMAIL
}
