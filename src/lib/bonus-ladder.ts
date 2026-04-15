import type { Profile, StrokeplayRound, SubSeason } from '@/lib/types'
import { getActiveOpenSubSeason } from '@/lib/sub-season'

/** Which bonus leg’s rounds to use for the home “Strokeplay ladder” table. */
export function getLadderSubSeasonId(subSeasons: SubSeason[] | undefined): string | undefined {
  const leg = getActiveOpenSubSeason(subSeasons)
  return leg?.id
}

/** Best two nets (rounds sorted by net ascending). */
export function getBestTwoRounds(rounds: StrokeplayRound[]): {
  r1: StrokeplayRound | undefined
  r2: StrokeplayRound | undefined
} {
  const sorted = [...rounds].sort((a, b) => a.net_score - b.net_score)
  return { r1: sorted[0], r2: sorted[1] }
}

export function ladderTotals(r1?: StrokeplayRound, r2?: StrokeplayRound): number | undefined {
  if (r1 && r2) return r1.net_score + r2.net_score
  if (r1) return r1.net_score
  return undefined
}

export type BonusLegRankRow = {
  player: Profile
  best_net: number
  second_net: number
}

/**
 * Rank players for a single bonus leg (lower best net first; tiebreak second best;
 * missing second counts worse).
 */
export function rankPlayersForBonusLeg(
  players: Profile[],
  rounds: StrokeplayRound[],
  subSeasonId: string
): BonusLegRankRow[] {
  const byPlayer = new Map<string, StrokeplayRound[]>()
  for (const r of rounds) {
    if (r.sub_season_id !== subSeasonId) continue
    const list = byPlayer.get(r.player_id) ?? []
    list.push(r)
    byPlayer.set(r.player_id, list)
  }
  const rows: BonusLegRankRow[] = players.map((player) => {
    const pr = byPlayer.get(player.id) ?? []
    const { r1, r2 } = getBestTwoRounds(pr)
    const best_net = r1?.net_score ?? Number.POSITIVE_INFINITY
    const second_net = r2?.net_score ?? Number.POSITIVE_INFINITY
    return { player, best_net, second_net }
  })
  rows.sort((a, b) => {
    if (a.best_net !== b.best_net) return a.best_net - b.best_net
    return a.second_net - b.second_net
  })
  return rows
}
