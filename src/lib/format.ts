import { formatDistanceToNow, format, parseISO } from 'date-fns'
import type { Profile } from '@/lib/types'

export function formatRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
  } catch {
    return 'recently'
  }
}

export function formatDate(dateString: string, pattern = 'MMM d, yyyy'): string {
  try {
    return format(parseISO(dateString), pattern)
  } catch {
    return dateString
  }
}

/** ZAR display (South African Rand). */
export function formatCurrency(amount: number, fractionDigits = 2): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : amount > 0 ? '+' : ''
  return `${sign}R ${abs.toFixed(fractionDigits)}`
}

export function formatWalletBalance(amount: number): string {
  return `R ${amount.toFixed(2)}`
}

export function formatRecord(wins: number, losses: number, draws: number): string {
  return `${wins}W ${losses}L ${draws}D`
}

export function formatNetScore(gross: number, handicap: number): number {
  return gross - handicap
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatMatchMargin(margin: string, result: 'win_a' | 'win_b' | 'draw'): string {
  if (result === 'draw') return 'Halved'
  return margin
}

export function formatPoints(points: number): string {
  if (points % 1 === 0) return points.toString()
  return points.toFixed(1)
}

export function formatStableford(points: number): string {
  return `${points} pts`
}

export function formatHandicap(handicap: number): string {
  return `HCP ${handicap}`
}

/** Primary label in UI: legal name when set, otherwise auth `display_name`. */
export function profileDisplayName(p: Pick<Profile, 'display_name' | 'full_name'>): string {
  const n = p.full_name?.trim()
  return n || p.display_name
}

/** First word of the display label (e.g. tour chumps). */
export function profileFirstName(p: Pick<Profile, 'display_name' | 'full_name'>): string {
  const n = profileDisplayName(p)
  return n.split(/\s+/)[0] ?? n
}
