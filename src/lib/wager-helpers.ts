import type { EnrichedTeamWager, EnrichedWager } from '@/lib/types'

export function needsOutcomeConfirmation(wager: EnrichedWager, profileId: string): boolean {
  if (wager.status !== 'pending_confirmation') return false
  const isProposer = wager.proposer_id === profileId
  if (wager.proposer_confirmed && !wager.opponent_confirmed && !isProposer) return true
  if (wager.opponent_confirmed && !wager.proposer_confirmed && isProposer) return true
  return false
}

export function waitingOnOpponentConfirmation(wager: EnrichedWager, profileId: string): boolean {
  if (wager.status !== 'pending_confirmation') return false
  const isProposer = wager.proposer_id === profileId
  if (wager.proposer_confirmed && !wager.opponent_confirmed && isProposer) return true
  if (wager.opponent_confirmed && !wager.proposer_confirmed && !isProposer) return true
  return false
}

export function needsTeamOutcomeConfirmation(w: EnrichedTeamWager, profileId: string): boolean {
  if (w.status !== 'pending_confirmation') return false
  const inA = profileId === w.team_a_p1 || profileId === w.team_a_p2
  const inB = profileId === w.team_b_p1 || profileId === w.team_b_p2
  if (w.team_a_confirmed && !w.team_b_confirmed && inB) return true
  if (w.team_b_confirmed && !w.team_a_confirmed && inA) return true
  return false
}

export function waitingOnOtherTeamConfirmation(w: EnrichedTeamWager, profileId: string): boolean {
  if (w.status !== 'pending_confirmation') return false
  const inA = profileId === w.team_a_p1 || profileId === w.team_a_p2
  const inB = profileId === w.team_b_p1 || profileId === w.team_b_p2
  if (w.team_a_confirmed && !w.team_b_confirmed && inA) return true
  if (w.team_b_confirmed && !w.team_a_confirmed && inB) return true
  return false
}

export function inTeamA(w: EnrichedTeamWager, profileId: string): boolean {
  return profileId === w.team_a_p1 || profileId === w.team_a_p2
}

export function inTeamB(w: EnrichedTeamWager, profileId: string): boolean {
  return profileId === w.team_b_p1 || profileId === w.team_b_p2
}
