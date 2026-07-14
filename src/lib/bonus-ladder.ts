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
  subSeason: Pick<SubSeason, 'id' | 'start_date' | 'end_date'>
): BonusLegRankRow[] {
  const counting = rounds.filter(
    (r) =>
      r.sub_season_id === subSeason.id &&
      r.played_at >= subSeason.start_date &&
      r.played_at <= subSeason.end_date
  )
  const byPlayer = new Map<string, StrokeplayRound[]>()
  for (const r of counting) {
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

/** Eligible players grouped by equal combined net (consecutive after ranking). */
export function groupEligibleByCombinedNet(ranked: BonusLegRankRow[]): BonusLegRankRow[][] {
  const eligible = ranked.filter((r) => r.combined_net < Number.POSITIVE_INFINITY)
  const groups: BonusLegRankRow[][] = []
  for (const row of eligible) {
    const last = groups[groups.length - 1]
    if (last && last[0]!.combined_net === row.combined_net) {
      last.push(row)
    } else {
      groups.push([row])
    }
  }
  return groups
}

export type BonusPodiumPosition = 1 | 2 | 3

export type BonusPodiumAward = {
  player_id: string
  position: BonusPodiumPosition
  points_awarded: number
  player: Profile
  best_net: number
  second_net: number
  combined_net: number
}

/** A group of players tied on combined net that must spin for contested podium places. */
export type BonusTieContest = {
  id: string
  /** First contested podium place (1–3). */
  startPosition: BonusPodiumPosition
  /** Podium places at stake, in ascending order. */
  positions: BonusPodiumPosition[]
  players: BonusLegRankRow[]
  combined_net: number
}

export type BonusPodiumPlan = {
  /** Awards that do not need a spin (clear places, or already resolved). */
  awards: BonusPodiumAward[]
  /** Tie groups that still need a wheel spin. */
  unresolvedContests: BonusTieContest[]
  /** All tie contests for this podium (resolved + unresolved). */
  contests: BonusTieContest[]
}

function awardFromRow(
  row: BonusLegRankRow,
  position: BonusPodiumPosition,
  bonusPts: [number, number, number]
): BonusPodiumAward {
  return {
    player_id: row.player.id,
    position,
    points_awarded: bonusPts[position - 1]!,
    player: row.player,
    best_net: row.best_net,
    second_net: row.second_net,
    combined_net: row.combined_net,
  }
}

function contestId(startPosition: BonusPodiumPosition, playerIds: string[]): string {
  return `tie-p${startPosition}-${playerIds.slice().sort().join('_')}`
}

/**
 * Map a spun player order onto a contest’s positions.
 * Extra players beyond the contested slots receive no award.
 */
export function applyTieOrder(
  contest: BonusTieContest,
  orderedPlayerIds: string[],
  bonusPts: [number, number, number]
): BonusPodiumAward[] {
  const byId = new Map(contest.players.map((r) => [r.player.id, r]))
  const awards: BonusPodiumAward[] = []
  for (let i = 0; i < contest.positions.length; i++) {
    const playerId = orderedPlayerIds[i]
    if (!playerId) break
    const row = byId.get(playerId)
    if (!row) continue
    awards.push(awardFromRow(row, contest.positions[i]!, bonusPts))
  }
  return awards
}

/**
 * Build podium awards for closing a bonus leg.
 * Ties on equal combined net overlapping places 1–3 become spin contests.
 * Pass `resolutions[contestId] = orderedPlayerIds` after each wheel resolves.
 */
export function buildPodiumPlan(
  ranked: BonusLegRankRow[],
  bonusPts: [number, number, number],
  resolutions: Record<string, string[]> = {}
): BonusPodiumPlan {
  const groups = groupEligibleByCombinedNet(ranked)
  const awards: BonusPodiumAward[] = []
  const contests: BonusTieContest[] = []
  const unresolvedContests: BonusTieContest[] = []
  let nextPosition = 1 as number

  for (const group of groups) {
    if (nextPosition > 3) break

    const slotsLeft = 4 - nextPosition
    if (group.length === 1) {
      const row = group[0]!
      awards.push(awardFromRow(row, nextPosition as BonusPodiumPosition, bonusPts))
      nextPosition += 1
      continue
    }

    const placeCount = Math.min(group.length, slotsLeft)
    const positions = Array.from(
      { length: placeCount },
      (_, i) => (nextPosition + i) as BonusPodiumPosition
    )
    const id = contestId(positions[0]!, group.map((r) => r.player.id))
    const contest: BonusTieContest = {
      id,
      startPosition: positions[0]!,
      positions,
      players: group,
      combined_net: group[0]!.combined_net,
    }
    contests.push(contest)

    const ordered = resolutions[id]
    if (ordered && ordered.length > 0) {
      awards.push(...applyTieOrder(contest, ordered, bonusPts))
    } else {
      unresolvedContests.push(contest)
    }
    nextPosition += placeCount
  }

  awards.sort((a, b) => a.position - b.position)
  return { awards, contests, unresolvedContests }
}
