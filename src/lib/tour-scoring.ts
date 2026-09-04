import type { TourFormat, TourHole, TourHoleScore, TourTeam } from './types'

export type SideAgg = 'better_ball' | 'individual' | 'by_par'
export type HoleWinner = 'a' | 'b' | 'half' | null
export type HoleCompare = 'higher' | 'lower_net'
export type ParCombine = 'better_ball' | 'sum' | 'product'

export interface MatchFormatSpec {
  agg: SideAgg
  compare: HoleCompare
  par: { 3: ParCombine; 4: ParCombine; 5: ParCombine }
  expectedMatches: number
}

const DEFAULT_PAR: MatchFormatSpec['par'] = { 3: 'better_ball', 4: 'better_ball', 5: 'better_ball' }

export function matchFormatFromRules(rules?: Record<string, unknown> | null): MatchFormatSpec {
  const preset = rules?.['preset']
  const aggRaw = rules?.['team_aggregation']
  const winRaw = rules?.['hole_win']
  const matchesRaw = rules?.['expected_matches']
  const expectedMatches = typeof matchesRaw === 'number' && matchesRaw > 0 ? matchesRaw : undefined

  if (preset === 'mixed_par_stableford' || aggRaw === 'by_par') {
    const parRules = (rules?.['par_rules'] ?? {}) as Record<string, string>
    const parse = (n: 3 | 4 | 5, fallback: ParCombine): ParCombine => {
      const v = parRules[String(n)]
      if (v === 'sum' || v === 'product' || v === 'better_ball') return v
      return fallback
    }
    return {
      agg: 'by_par',
      compare: 'higher',
      par: { 3: parse(3, 'sum'), 4: parse(4, 'better_ball'), 5: parse(5, 'product') },
      expectedMatches: expectedMatches ?? 4,
    }
  }

  if (preset === 'singles_matchplay' || winRaw === 'lower_net') {
    return {
      agg: 'individual',
      compare: 'lower_net',
      par: DEFAULT_PAR,
      expectedMatches: expectedMatches ?? 8,
    }
  }

  if (preset === 'singles_stableford' || aggRaw === 'individual') {
    return {
      agg: 'individual',
      compare: 'higher',
      par: DEFAULT_PAR,
      expectedMatches: expectedMatches ?? 8,
    }
  }

  return {
    agg: 'better_ball',
    compare: 'higher',
    par: DEFAULT_PAR,
    expectedMatches: expectedMatches ?? 4,
  }
}

export function matchFormatFromTourFormat(format?: Pick<TourFormat, 'scoring_rules'> | null): MatchFormatSpec {
  return matchFormatFromRules(format?.scoring_rules)
}

export function expectedMatchCount(format?: Pick<TourFormat, 'scoring_rules'> | null, dayNumber?: number): number {
  if (format) return matchFormatFromTourFormat(format).expectedMatches
  return dayNumber === 3 ? 8 : 4
}

/** @deprecated use matchFormatFromTourFormat — kept for older better-ball / singles callers */
export function aggregationFromFormat(format?: Pick<TourFormat, 'scoring_rules'> | null): SideAgg {
  return matchFormatFromTourFormat(format).agg
}

export function sideStableford(points: number[], agg: Exclude<SideAgg, 'by_par'>): number | null {
  if (points.length === 0) return null
  if (agg === 'better_ball') return Math.max(...points)
  return points.reduce((sum, n) => sum + n, 0)
}

export function holeWinner(a: number | null, b: number | null, compare: HoleCompare = 'higher'): HoleWinner {
  if (a == null || b == null) return null
  if (a === b) return 'half'
  if (compare === 'lower_net') return a < b ? 'a' : 'b'
  return a > b ? 'a' : 'b'
}

export function combineByPar(par: number, spec: MatchFormatSpec): ParCombine {
  if (par === 3 || par === 4 || par === 5) return spec.par[par]
  return 'better_ball'
}

export function holeFormatLabel(spec: MatchFormatSpec, par: number): string {
  if (spec.compare === 'lower_net') return 'Matchplay · lower net'
  if (spec.agg === 'by_par') {
    const how = combineByPar(par, spec)
    if (how === 'sum') return 'Add both'
    if (how === 'product') return 'Multiply both'
    return 'Better ball'
  }
  if (spec.agg === 'better_ball') return 'Better ball'
  return 'Singles'
}

export interface MatchHoleView {
  hole: number
  winner: HoleWinner
  winnerTeam: TourTeam | 'half' | null
  aPoints: number | null
  bPoints: number | null
}

export interface ComputedMatch {
  holes: MatchHoleView[]
  aWins: number
  bWins: number
  holesPlayed: number
  closed: boolean
  statusLabel: string
  leader: TourTeam | 'half' | null
  pointsA: number
  pointsB: number
  points93: number
  points91: number
}

export function computeMatchPlay(
  scores: Pick<TourHoleScore, 'tour_player_id' | 'hole_number' | 'stableford_points' | 'net_score'>[],
  playerIdsA: string[],
  playerIdsB: string[],
  teamA: TourTeam,
  teamB: TourTeam,
  spec: MatchFormatSpec,
  holes: Pick<TourHole, 'hole_number' | 'par'>[] = [],
): ComputedMatch {
  const sf = new Map<string, number>()
  const net = new Map<string, number>()
  for (const s of scores) {
    const key = `${s.tour_player_id}:${s.hole_number}`
    sf.set(key, s.stableford_points)
    net.set(key, s.net_score)
  }
  const parByHole = new Map(holes.map((h) => [h.hole_number, h.par]))

  const views: MatchHoleView[] = []
  let aWins = 0
  let bWins = 0

  for (let n = 1; n <= 18; n++) {
    const par = parByHole.get(n) ?? 4
    const aPts = sideValueForHole(playerIdsA, n, sf, net, spec, par)
    const bPts = sideValueForHole(playerIdsB, n, sf, net, spec, par)
    const winner = holeWinner(aPts, bPts, spec.compare)
    if (winner === 'a') aWins++
    if (winner === 'b') bWins++
    views.push({
      hole: n,
      winner,
      winnerTeam: winner == null ? null : winner === 'half' ? 'half' : winner === 'a' ? teamA : teamB,
      aPoints: aPts,
      bPoints: bPts,
    })
  }

  const holesPlayed = views.filter((h) => h.winner != null).length
  const lead = aWins - bWins
  const remaining = 18 - holesPlayed
  const closed = holesPlayed > 0 && (remaining === 0 || Math.abs(lead) > remaining)

  let pointsA = 0
  let pointsB = 0
  if (closed) {
    if (lead > 0) pointsA = 1
    else if (lead < 0) pointsB = 1
    else {
      pointsA = 0.5
      pointsB = 0.5
    }
  }

  const leader: TourTeam | 'half' | null =
    holesPlayed === 0 ? null : lead > 0 ? teamA : lead < 0 ? teamB : 'half'

  return {
    holes: views,
    aWins,
    bWins,
    holesPlayed,
    closed,
    statusLabel: matchStatusLabel(teamA, teamB, aWins, bWins, holesPlayed, remaining, closed),
    leader,
    pointsA,
    pointsB,
    points93: teamA === '93s' ? pointsA : pointsB,
    points91: teamA === '91s' ? pointsA : pointsB,
  }
}

function sideValueForHole(
  playerIds: string[],
  hole: number,
  sf: Map<string, number>,
  net: Map<string, number>,
  spec: MatchFormatSpec,
  par: number,
): number | null {
  const source = spec.compare === 'lower_net' ? net : sf
  const values: number[] = []
  for (const id of playerIds) {
    const v = source.get(`${id}:${hole}`)
    if (v != null) values.push(v)
  }
  if (values.length === 0) return null

  const combine: ParCombine =
    spec.agg === 'by_par' ? combineByPar(par, spec) : spec.agg === 'better_ball' ? 'better_ball' : 'sum'

  if (combine === 'better_ball') return Math.max(...values)
  if (values.length < playerIds.length || playerIds.length === 0) return null
  if (combine === 'product') return values.reduce((acc, n) => acc * n, 1)
  return values.reduce((acc, n) => acc + n, 0)
}

export function matchStatusLabel(
  teamA: TourTeam,
  teamB: TourTeam,
  aWins: number,
  bWins: number,
  holesPlayed: number,
  remaining: number,
  closed: boolean,
): string {
  if (holesPlayed === 0) return 'AS'
  const lead = aWins - bWins
  if (lead === 0) return closed ? 'HALVED' : 'AS'
  const leader = lead > 0 ? teamA : teamB
  const n = Math.abs(lead)
  if (closed && remaining > 0) return `${leader} ${n}&${remaining}`
  if (closed) return `${leader} ${n} UP`
  return `${leader} ${n} UP`
}

export function playerStablefordTotal(scores: TourHoleScore[], tourPlayerId: string): number {
  return scores
    .filter((s) => s.tour_player_id === tourPlayerId)
    .reduce((sum, s) => sum + s.stableford_points, 0)
}

export const CHAMPS_RANK_BUDGET = 32
export const CHAMPS_PICK_COUNT = 4

export function champsRankSum(seeds: number[]): number {
  return seeds.reduce((sum, n) => sum + n, 0)
}

/** True if remaining picks can still reach at least `budget` (32 or more). */
export function canFillRankBudget(
  pickedSeeds: number[],
  poolSeeds: number[],
  budget = CHAMPS_RANK_BUDGET,
  slots = CHAMPS_PICK_COUNT,
): boolean {
  const left = slots - pickedSeeds.length
  const current = champsRankSum(pickedSeeds)
  if (left === 0) return current >= budget
  if (left > poolSeeds.length) return false
  const maxAdd = [...poolSeeds]
    .sort((a, b) => b - a)
    .slice(0, left)
    .reduce((sum, n) => sum + n, 0)
  return current + maxAdd >= budget
}

export function champsEntryPoints(
  pickIds: string[],
  captainId: string,
  captainDay: 1 | 2 | 3,
  pointsByPlayerDay: Map<string, number>,
): number {
  let total = 0
  for (const id of pickIds) {
    const d1 = pointsByPlayerDay.get(`${id}:1`) ?? 0
    const d2 = pointsByPlayerDay.get(`${id}:2`) ?? 0
    const d3 = pointsByPlayerDay.get(`${id}:3`) ?? 0
    const days = { 1: d1, 2: d2, 3: d3 }
    total += d1 + d2 + d3
    if (id === captainId) total += days[captainDay]
  }
  return total
}
