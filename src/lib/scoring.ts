import { STABLEFORD_POINTS } from './constants'
import type { TourHole } from './types'

export function calculateNetScore(grossScore: number, handicap: number): number {
  return grossScore - handicap
}

export function calculateStablefordPoints(
  grossScore: number,
  par: number,
  strokeIndex: number,
  handicap: number
): number {
  const strokesReceived = Math.floor(handicap / 18) + (strokeIndex <= (handicap % 18) ? 1 : 0)
  const netScore = grossScore - strokesReceived
  const toPar = netScore - par

  if (toPar <= -3) return STABLEFORD_POINTS.ALBATROSS
  if (toPar === -2) return STABLEFORD_POINTS.EAGLE
  if (toPar === -1) return STABLEFORD_POINTS.BIRDIE
  if (toPar === 0) return STABLEFORD_POINTS.PAR
  if (toPar === 1) return STABLEFORD_POINTS.BOGEY
  return STABLEFORD_POINTS.DOUBLE_BOGEY_OR_WORSE
}

export function calculateBetterBallStableford(
  scores: { playerId: string; stablefordPoints: number }[]
): number {
  if (scores.length === 0) return 0
  return Math.max(...scores.map((s) => s.stablefordPoints))
}

export function calculateMatchplayPoints(
  teamAStableford: number[],
  teamBStableford: number[]
): { teamA: number; teamB: number } {
  const holesPlayed = Math.min(teamAStableford.length, teamBStableford.length)
  let teamAWins = 0
  let teamBWins = 0

  for (let i = 0; i < holesPlayed; i++) {
    if (teamAStableford[i] > teamBStableford[i]) teamAWins++
    else if (teamBStableford[i] > teamAStableford[i]) teamBWins++
  }

  const lead = teamAWins - teamBWins
  const holesRemaining = 18 - holesPlayed

  // Match decided early
  if (Math.abs(lead) > holesRemaining) {
    return lead > 0 ? { teamA: 1, teamB: 0 } : { teamA: 0, teamB: 1 }
  }

  // All holes played
  if (holesPlayed === 18) {
    if (lead > 0) return { teamA: 1, teamB: 0 }
    if (lead < 0) return { teamA: 0, teamB: 1 }
    return { teamA: 0.5, teamB: 0.5 }
  }

  // In progress
  return { teamA: 0, teamB: 0 }
}

export function getStrokesReceived(handicap: number, strokeIndex: number): number {
  return Math.floor(handicap / 18) + (strokeIndex <= (handicap % 18) ? 1 : 0)
}

export function getMatchplayStatus(
  teamAWins: number,
  teamBWins: number,
  holesPlayed: number
): string {
  const lead = teamAWins - teamBWins
  const holesRemaining = 18 - holesPlayed

  if (holesPlayed === 0) return 'AS'

  if (Math.abs(lead) > holesRemaining) {
    const upBy = Math.abs(lead)
    const suffix = holesRemaining === 0 ? '' : `&${holesRemaining}`
    return lead > 0 ? `${upBy}${suffix}` : `${upBy}${suffix}`
  }

  if (lead === 0) return 'AS'
  return lead > 0 ? `${lead} UP` : `${Math.abs(lead)} DN`
}

export function computeGroupStandings(
  players: import('./types').Profile[],
  results: import('./types').MatchplayResult[],
  bonusPoints: Record<string, number>
) {
  return players
    .map((player) => {
      const playerResults = results.filter(
        (r) => r.player_a_id === player.id || r.player_b_id === player.id
      )

      let wins = 0
      let losses = 0
      let draws = 0

      playerResults.forEach((r) => {
        const isA = r.player_a_id === player.id
        if (r.result === 'draw') {
          draws++
        } else if ((r.result === 'win_a' && isA) || (r.result === 'win_b' && !isA)) {
          wins++
        } else {
          losses++
        }
      })

      const matchPoints = wins * 3 + draws * 1
      const bonus = bonusPoints[player.id] ?? 0
      const total = matchPoints + bonus

      return {
        player,
        wins,
        losses,
        draws,
        played: playerResults.length,
        points: matchPoints,
        bonus_points: bonus,
        total_points: total,
      }
    })
    .sort((a, b) => b.total_points - a.total_points || b.wins - a.wins)
    .map((entry, index) => ({ ...entry, position: index + 1 }))
}

export function computeBonusLeague(
  rounds: import('./types').StrokeplayRound[],
  subSeasonId: string
): Map<string, { best: number; second: number; rounds: import('./types').StrokeplayRound[] }> {
  const playerRounds = new Map<
    string,
    { best: number; second: number; rounds: import('./types').StrokeplayRound[] }
  >()

  const filtered = rounds.filter((r) => r.sub_season_id === subSeasonId)

  filtered.forEach((round) => {
    const existing = playerRounds.get(round.player_id) ?? {
      best: Infinity,
      second: Infinity,
      rounds: [],
    }
    existing.rounds.push(round)

    const sorted = [...existing.rounds].sort((a, b) => a.net_score - b.net_score)
    existing.best = sorted[0]?.net_score ?? Infinity
    existing.second = sorted[1]?.net_score ?? Infinity

    playerRounds.set(round.player_id, existing)
  })

  return playerRounds
}

export function computeTourHoleScore(
  grossScore: number,
  hole: TourHole,
  playerHandicap: number
): { net: number; stableford: number } {
  const strokesReceived = getStrokesReceived(playerHandicap, hole.stroke_index)
  const net = grossScore - strokesReceived
  const toPar = net - hole.par

  let stableford = 0
  if (toPar <= -3) stableford = 5
  else if (toPar === -2) stableford = 4
  else if (toPar === -1) stableford = 3
  else if (toPar === 0) stableford = 2
  else if (toPar === 1) stableford = 1
  else stableford = 0

  return { net, stableford }
}
