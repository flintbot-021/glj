import { useEffect, useState } from 'react'
import { champsDeadlineIso, formatChampsCountdown, champsPicksLocked } from '@/lib/tour-colors'

/** Live countdown to Champs lock/reveal. Re-renders every second until locked. */
export function useChampsCountdown(deadline?: string | null) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (champsPicksLocked(deadline, now)) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [deadline, now])

  const locked = champsPicksLocked(deadline, now)
  return {
    locked,
    label: formatChampsCountdown(deadline, now),
    deadlineLabel: new Date(champsDeadlineIso(deadline)).toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Johannesburg',
    }),
  }
}
