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

/** Sum of the two counting nets; undefined until a player has logged two rounds in the leg. */
export function ladderTotals(r1?: StrokeplayRound, r2?: StrokeplayRound): number | undefined {
  if (r1 && r2) return r1.net_score + r2.net_score
  return undefined
}

export type BonusLegRankRow = {
  player: Profile
  /** Lowest net in the leg (first of the two counting rounds). */
  best_net: number
  /** Second-lowest net (second counting round). */
  second_net: number
  /** Sum of the two lowest nets; `Infinity` until two rounds are logged. */
  combined_net: number
}

/**
 * Rank players for a single bonus leg by **lowest combined** net (sum of your two lowest rounds in the leg).
 * Ties: lower second-lowest net, then lower best net. Players need two rounds to be eligible; others sort last.
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
    const eligible = r1 != null && r2 != null
    const best_net = r1?.net_score ?? Number.POSITIVE_INFINITY
    const second_net = r2?.net_score ?? Number.POSITIVE_INFINITY
    const combined_net = eligible ? r1.net_score + r2.net_score : Number.POSITIVE_INFINITY
    return { player, best_net, second_net, combined_net }
  })
  rows.sort((a, b) => {
    const aEl = a.combined_net < Number.POSITIVE_INFINITY
    const bEl = b.combined_net < Number.POSITIVE_INFINITY
    if (aEl !== bEl) return aEl ? -1 : 1
    if (a.combined_net !== b.combined_net) return a.combined_net - b.combined_net
    if (a.second_net !== b.second_net) return a.second_net - b.second_net
    return a.best_net - b.best_net
  })
  return rows
}
