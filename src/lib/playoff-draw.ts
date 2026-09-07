/** Playoff draw: 8 qualifiers placed into 8 QF slots across two bracket halves. */

export type PlayoffHalf = 'left' | 'right'
export type PlayoffSlotKey =
  | 'qf1_a'
  | 'qf1_b'
  | 'qf2_a'
  | 'qf2_b'
  | 'qf3_a'
  | 'qf3_b'
  | 'qf4_a'
  | 'qf4_b'

export interface PlayoffSlotDef {
  key: PlayoffSlotKey
  half: PlayoffHalf
  qf: 1 | 2 | 3 | 4
  seat: 'a' | 'b'
  /** Short label on the wheel */
  wheel: string
  /** Spoken / ceremony label */
  label: string
}

export const PLAYOFF_SLOTS: PlayoffSlotDef[] = [
  { key: 'qf1_a', half: 'left', qf: 1, seat: 'a', wheel: 'L · QF1 A', label: 'Left bracket · Quarter-final 1' },
  { key: 'qf1_b', half: 'left', qf: 1, seat: 'b', wheel: 'L · QF1 B', label: 'Left bracket · Quarter-final 1' },
  { key: 'qf2_a', half: 'left', qf: 2, seat: 'a', wheel: 'L · QF2 A', label: 'Left bracket · Quarter-final 2' },
  { key: 'qf2_b', half: 'left', qf: 2, seat: 'b', wheel: 'L · QF2 B', label: 'Left bracket · Quarter-final 2' },
  { key: 'qf3_a', half: 'right', qf: 3, seat: 'a', wheel: 'R · QF3 A', label: 'Right bracket · Quarter-final 3' },
  { key: 'qf3_b', half: 'right', qf: 3, seat: 'b', wheel: 'R · QF3 B', label: 'Right bracket · Quarter-final 3' },
  { key: 'qf4_a', half: 'right', qf: 4, seat: 'a', wheel: 'R · QF4 A', label: 'Right bracket · Quarter-final 4' },
  { key: 'qf4_b', half: 'right', qf: 4, seat: 'b', wheel: 'R · QF4 B', label: 'Right bracket · Quarter-final 4' },
]

export const PLAYOFF_SLOT_KEYS = PLAYOFF_SLOTS.map((s) => s.key)

export const SLOT_BY_KEY = new Map(PLAYOFF_SLOTS.map((s) => [s.key, s]))

export type PlayoffDrawStatus = 'setup' | 'drawing' | 'complete'
export type PlayoffDrawPhase = 'setup' | 'await_spin' | 'revealed' | 'complete'

export interface PlayoffEntry {
  id: string
  draw_id: string
  player_id: string
  slot_key: PlayoffSlotKey | null
  drawn_at: string | null
}

export interface PlayoffDraw {
  id: string
  season_id: string
  status: PlayoffDrawStatus
  phase: PlayoffDrawPhase
  current_spinner_id: string | null
  last_assigned_slot: PlayoffSlotKey | null
  created_at: string
  updated_at: string
}

export function slotDef(key: PlayoffSlotKey): PlayoffSlotDef {
  return SLOT_BY_KEY.get(key)!
}

export function remainingPlayers(entries: PlayoffEntry[]): PlayoffEntry[] {
  return entries.filter((e) => e.slot_key == null)
}

export function emptySlots(entries: PlayoffEntry[]): PlayoffSlotDef[] {
  const taken = new Set(entries.map((e) => e.slot_key).filter(Boolean) as PlayoffSlotKey[])
  return PLAYOFF_SLOTS.filter((s) => !taken.has(s.key))
}

export function pickRandom<T>(items: T[], rand: () => number = Math.random): T | null {
  if (items.length === 0) return null
  return items[Math.floor(rand() * items.length)] ?? null
}

export function qfSlotFromKey(key: PlayoffSlotKey): { slot_index: 1 | 2 | 3 | 4; seat: 'a' | 'b' } {
  const s = slotDef(key)
  return { slot_index: s.qf, seat: s.seat }
}

export function fieldIsValid(playerIds: string[]): string | null {
  const ids = playerIds.filter(Boolean)
  if (ids.length !== 8) return 'Pick exactly eight players.'
  if (new Set(ids).size !== 8) return 'Each qualifier must be a different player.'
  return null
}

export function drawComplete(entries: PlayoffEntry[]): boolean {
  return entries.length === 8 && entries.every((e) => e.slot_key != null)
}

/** Top two from each group, in group order — a convenience fill for the eight. */
export function qualifierIdsFromGroupLeaders(groups: { topIds: string[] }[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const g of groups) {
    for (const id of g.topIds.slice(0, 2)) {
      if (!id || seen.has(id)) continue
      seen.add(id)
      out.push(id)
      if (out.length === 8) return out
    }
  }
  return out
}

export function isPlayoffSlotKey(v: string | null | undefined): v is PlayoffSlotKey {
  return PLAYOFF_SLOT_KEYS.includes(v as PlayoffSlotKey)
}
