import type { SubSeason } from '@/lib/types'

/** Open sub-season whose dates include today, else first open leg still marked open. */
export function getActiveOpenSubSeason(subSeasons: SubSeason[] | undefined): SubSeason | undefined {
  if (!subSeasons?.length) return undefined
  const open = subSeasons.filter((s) => s.status === 'open')
  if (open.length === 0) return undefined
  const today = new Date().toISOString().slice(0, 10)
  const inWindow = open.find((s) => s.start_date <= today && s.end_date >= today)
  return inWindow ?? open[0]
}
