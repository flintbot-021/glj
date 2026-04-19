import { supabase } from '@/lib/supabase'
import { computeGroupStandings } from '@/lib/scoring'
import { MATCH_PLAY_POINTS } from '@/lib/league-rules'
import type {
  ActivityFeedItem,
  GroupStanding,
  Group,
  Profile,
  Season,
  WagerStatus,
  TeamWager,
  KnockoutFixture,
  KnockoutRound,
  WalletTransaction,
  TourDayStatus,
  TourMatchStatus,
  TourStatus,
  TourTeam,
} from '@/lib/types'
import {
  mapProfile,
  mapSeason,
  mapGroup,
  mapMatchplayResult,
  mapSubSeason,
  mapStrokeplayRound,
  mapBonusAward,
  mapKnockoutFixture,
  mapWager,
  mapTeamWager,
  mapWalletTx,
  mapFeedItem,
  mapNotification,
  mapTourEvent,
  mapTourPlayer,
  mapTourCourse,
  mapTourHole,
  mapTourFormat,
  mapTourDay,
  mapTourMatch,
  mapTourMatchPlayer,
  mapTourHoleScore,
  mapTourChumpsPick,
  mapTourPlayerDayHandicap,
} from '@/lib/supabase/mappers'

function throwOnErr<T>(hint: string, res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(`${hint}: ${res.error.message}`)
  if (res.data === null || res.data === undefined) throw new Error(`${hint}: no data`)
  return res.data
}

function firstRpcRow(data: unknown): Record<string, unknown> | null {
  if (data == null) return null
  if (Array.isArray(data)) {
    const row = data[0]
    return row && typeof row === 'object' ? (row as Record<string, unknown>) : null
  }
  if (typeof data === 'object') return data as Record<string, unknown>
  return null
}

export async function listProfiles(): Promise<Profile[]> {
  const res = await supabase.from('profiles').select('*').order('display_name', { ascending: true })
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapProfile)
}

export async function getProfile(id: string): Promise<Profile | null> {
  const res = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ? mapProfile(res.data as Record<string, unknown>) : null
}

export async function fetchProfileMap(ids: string[]): Promise<Map<string, Profile>> {
  const u = [...new Set(ids)].filter(Boolean)
  if (u.length === 0) return new Map()
  const res = await supabase.from('profiles').select('*').in('id', u)
  if (res.error) throw new Error(res.error.message)
  const m = new Map<string, Profile>()
  for (const row of res.data as Record<string, unknown>[]) {
    const p = mapProfile(row)
    m.set(p.id, p)
  }
  return m
}

export async function fetchActiveSeason() {
  const active = await supabase.from('seasons').select('*').eq('is_active', true).maybeSingle()
  if (active.error) throw new Error(active.error.message)
  if (active.data) return mapSeason(active.data as Record<string, unknown>)
  const latest = await supabase.from('seasons').select('*').order('year', { ascending: false }).limit(1).maybeSingle()
  if (latest.error) throw new Error(latest.error.message)
  return latest.data ? mapSeason(latest.data as Record<string, unknown>) : null
}

export async function fetchSeasonById(seasonId: string): Promise<Season | null> {
  const res = await supabase.from('seasons').select('*').eq('id', seasonId).maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ? mapSeason(res.data as Record<string, unknown>) : null
}

function matchPointsFromSeason(season: Season | null) {
  if (!season) {
    return { winPoints: MATCH_PLAY_POINTS.win, drawPoints: MATCH_PLAY_POINTS.draw }
  }
  return { winPoints: season.win_points, drawPoints: season.draw_points }
}

export async function fetchGroupsForSeason(seasonId: string) {
  const res = await supabase.from('groups').select('*').eq('season_id', seasonId).order('name')
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapGroup)
}

export async function fetchGroupForPlayer(playerId: string) {
  const m = await supabase.from('group_memberships').select('group_id').eq('player_id', playerId).maybeSingle()
  if (m.error) throw new Error(m.error.message)
  if (!m.data) return null
  const g = await supabase.from('groups').select('*').eq('id', m.data.group_id).maybeSingle()
  if (g.error) throw new Error(g.error.message)
  return g.data ? mapGroup(g.data as Record<string, unknown>) : null
}

export async function fetchPlayersInGroup(groupId: string): Promise<Profile[]> {
  const m = await supabase.from('group_memberships').select('player_id').eq('group_id', groupId)
  if (m.error) throw new Error(m.error.message)
  const ids = (m.data as { player_id: string }[]).map((x) => x.player_id)
  return ids.length ? listProfilesByIds(ids) : []
}

async function listProfilesByIds(ids: string[]): Promise<Profile[]> {
  const res = await supabase.from('profiles').select('*').in('id', ids)
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapProfile)
}

export async function fetchMatchplayForGroup(groupId?: string, seasonId?: string) {
  let q = supabase.from('matchplay_results').select('*').order('played_at', { ascending: false })
  if (groupId) q = q.eq('group_id', groupId)
  if (seasonId) q = q.eq('season_id', seasonId)
  const res = await q
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapMatchplayResult)
}

export async function fetchSubSeasonsForSeason(seasonId: string) {
  const res = await supabase.from('sub_seasons').select('*').eq('season_id', seasonId).order('start_date')
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapSubSeason)
}

export async function fetchStrokeplayForSubSeasons(subSeasonIds: string[]) {
  if (subSeasonIds.length === 0) return []
  const res = await supabase.from('strokeplay_rounds').select('*').in('sub_season_id', subSeasonIds)
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapStrokeplayRound)
}

export async function fetchStrokeplayForPlayer(playerId: string) {
  const res = await supabase
    .from('strokeplay_rounds')
    .select('*')
    .eq('player_id', playerId)
    .order('played_at', { ascending: false })
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapStrokeplayRound)
}

export async function fetchBonusAwardsForSubSeasons(subSeasonIds: string[]) {
  if (subSeasonIds.length === 0) return []
  const res = await supabase.from('bonus_point_awards').select('*').in('sub_season_id', subSeasonIds)
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapBonusAward)
}

const KNOCKOUT_ROUND_ORDER: Record<KnockoutRound, number> = { qf: 0, sf: 1, final: 2 }

function sortKnockoutFixtures<T extends { round: KnockoutRound; slot_index?: number; created_at: string }>(
  rows: T[]
): T[] {
  return [...rows].sort((a, b) => {
    const rd = KNOCKOUT_ROUND_ORDER[a.round] - KNOCKOUT_ROUND_ORDER[b.round]
    if (rd !== 0) return rd
    const sa = a.slot_index ?? 1
    const sb = b.slot_index ?? 1
    if (sa !== sb) return sa - sb
    return a.created_at.localeCompare(b.created_at)
  })
}

export async function fetchKnockoutForSeason(seasonId: string) {
  const res = await supabase.from('knockout_fixtures').select('*').eq('season_id', seasonId)
  if (res.error) throw new Error(res.error.message)
  const rows = (res.data as Record<string, unknown>[]).map(mapKnockoutFixture)
  return sortKnockoutFixtures(rows)
}

export async function buildGroupStandings(
  groupId: string,
  seasonId: string
): Promise<GroupStanding[]> {
  const [players, results, subSeasons, seasonRow] = await Promise.all([
    fetchPlayersInGroup(groupId),
    fetchMatchplayForGroup(groupId, seasonId),
    fetchSubSeasonsForSeason(seasonId),
    fetchSeasonById(seasonId),
  ])
  const ssIds = subSeasons.map((s) => s.id)
  const bonusAwards = await fetchBonusAwardsForSubSeasons(ssIds)
  const bonusMap: Record<string, number> = {}
  bonusAwards.forEach((a) => {
    bonusMap[a.player_id] = (bonusMap[a.player_id] ?? 0) + a.points_awarded
  })
  const mp = matchPointsFromSeason(seasonRow)
  return computeGroupStandings(players, results, bonusMap, mp).map((s) => ({
    ...s,
    group_id: groupId,
  }))
}

export async function buildAllGroupStandings(seasonId: string) {
  const [groups, subSeasons, seasonRow] = await Promise.all([
    fetchGroupsForSeason(seasonId),
    fetchSubSeasonsForSeason(seasonId),
    fetchSeasonById(seasonId),
  ])
  const ssIds = subSeasons.map((s) => s.id)
  const bonusAwards = await fetchBonusAwardsForSubSeasons(ssIds)
  const bonusMap: Record<string, number> = {}
  bonusAwards.forEach((a) => {
    bonusMap[a.player_id] = (bonusMap[a.player_id] ?? 0) + a.points_awarded
  })
  const mp = matchPointsFromSeason(seasonRow)

  const out: { group: ReturnType<typeof mapGroup>; standings: GroupStanding[] }[] = []
  for (const group of groups) {
    const players = await fetchPlayersInGroup(group.id)
    const results = await fetchMatchplayForGroup(group.id, seasonId)
    out.push({
      group,
      standings: computeGroupStandings(players, results, bonusMap, mp).map((s) => ({
        ...s,
        group_id: group.id,
      })),
    })
  }
  return out
}

export async function fetchUnplayedOpponentProfiles(playerId: string, groupId: string): Promise<Profile[]> {
  const groupPlayers = (await fetchPlayersInGroup(groupId)).filter((p) => p.id !== playerId)
  const results = await fetchMatchplayForGroup(groupId)
  const playedIds = new Set<string>()
  for (const r of results) {
    if (r.player_a_id === playerId) playedIds.add(r.player_b_id)
    else if (r.player_b_id === playerId) playedIds.add(r.player_a_id)
  }
  return groupPlayers.filter((p) => !playedIds.has(p.id))
}

export async function listWagers(playerId?: string, statusFilter?: WagerStatus[]) {
  let q = supabase.from('wagers').select('*').order('created_at', { ascending: false })
  if (playerId) {
    q = q.or(`proposer_id.eq.${playerId},opponent_id.eq.${playerId}`)
  }
  if (statusFilter && statusFilter.length > 0) {
    q = q.in('status', statusFilter)
  }
  const res = await q
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapWager)
}

export async function listTeamWagers(playerId?: string, statusFilter?: WagerStatus[]) {
  let q = supabase.from('team_wagers').select('*').order('created_at', { ascending: false })
  if (playerId) {
    q = q.or(
      `team_a_p1.eq.${playerId},team_a_p2.eq.${playerId},team_b_p1.eq.${playerId},team_b_p2.eq.${playerId}`,
    )
  }
  if (statusFilter && statusFilter.length > 0) {
    q = q.in('status', statusFilter)
  }
  const res = await q
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapTeamWager)
}

export async function listWalletTransactions(playerId: string) {
  const res = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapWalletTx)
}

const FEED_PAGE = 20

export async function fetchActivityFeedPage(seasonId: string, page: number) {
  const from = page * FEED_PAGE
  const to = from + FEED_PAGE - 1
  const res = await supabase
    .from('activity_feed')
    .select('*', { count: 'exact' })
    .eq('season_id', seasonId)
    .order('created_at', { ascending: false })
    .range(from, to)
  if (res.error) throw new Error(res.error.message)
  const items = (res.data as Record<string, unknown>[]).map(mapFeedItem)
  const total = res.count ?? items.length
  return {
    items,
    hasMore: (page + 1) * FEED_PAGE < total,
    total,
  }
}

export async function listNotifications(recipientId: string) {
  const res = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false })
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapNotification)
}

export async function countUnreadNotifications(recipientId: string) {
  const res = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', recipientId)
    .eq('is_read', false)
  if (res.error) throw new Error(res.error.message)
  return res.count ?? 0
}

export async function fetchTourEvent() {
  const active = await supabase.from('tour_events').select('*').eq('status', 'active').limit(1).maybeSingle()
  if (active.error) throw new Error(active.error.message)
  if (active.data) return mapTourEvent(active.data as Record<string, unknown>)
  const latest = await supabase.from('tour_events').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (latest.error) throw new Error(latest.error.message)
  return latest.data ? mapTourEvent(latest.data as Record<string, unknown>) : null
}

export async function fetchTourPlayers(tourId: string) {
  const res = await supabase.from('tour_players').select('*').eq('tour_id', tourId).order('seed')
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapTourPlayer)
}

export async function fetchTourCourses(tourId: string) {
  const res = await supabase.from('tour_courses').select('*').eq('tour_id', tourId)
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapTourCourse)
}

export async function fetchTourFormats() {
  const res = await supabase.from('tour_formats').select('*')
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapTourFormat)
}

export async function fetchTourDays(tourId: string) {
  const res = await supabase.from('tour_days').select('*').eq('tour_id', tourId).order('day_number')
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapTourDay)
}

export async function fetchTourDayById(dayId: string) {
  const res = await supabase.from('tour_days').select('*').eq('id', dayId).maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ? mapTourDay(res.data as Record<string, unknown>) : null
}

export async function fetchTourFormatById(formatId: string) {
  const res = await supabase.from('tour_formats').select('*').eq('id', formatId).maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ? mapTourFormat(res.data as Record<string, unknown>) : null
}

export async function fetchTourCourseById(courseId: string) {
  const res = await supabase.from('tour_courses').select('*').eq('id', courseId).maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ? mapTourCourse(res.data as Record<string, unknown>) : null
}

export async function fetchTourMatchesForDay(dayId: string) {
  const res = await supabase.from('tour_matches').select('*').eq('tour_day_id', dayId)
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapTourMatch)
}

export async function fetchTourMatchPlayersForMatches(matchIds: string[]) {
  if (matchIds.length === 0) return []
  const res = await supabase.from('tour_match_players').select('*').in('match_id', matchIds)
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapTourMatchPlayer)
}

export async function fetchTourHolesForCourse(courseId: string) {
  const res = await supabase.from('tour_holes').select('*').eq('course_id', courseId).order('hole_number')
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapTourHole)
}

export async function fetchTourHoleScores(matchId: string) {
  const res = await supabase.from('tour_hole_scores').select('*').eq('match_id', matchId)
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapTourHoleScore)
}

export async function fetchTourChumpsPicks(tourId: string) {
  const res = await supabase.from('tour_chumps_picks').select('*').eq('tour_id', tourId)
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapTourChumpsPick)
}

export async function fetchTourPlayerDayHandicapsForDay(dayId: string) {
  const res = await supabase.from('tour_player_day_handicaps').select('*').eq('tour_day_id', dayId)
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapTourPlayerDayHandicap)
}

/** Admin: set course handicap for a player on a given tour day (upsert). */
export async function upsertTourPlayerDayHandicap(payload: {
  tour_day_id: string
  tour_player_id: string
  course_handicap: number
}) {
  const res = await supabase
    .from('tour_player_day_handicaps')
    .upsert(
      {
        tour_day_id: payload.tour_day_id,
        tour_player_id: payload.tour_player_id,
        course_handicap: payload.course_handicap,
      },
      { onConflict: 'tour_day_id,tour_player_id' }
    )
    .select('*')
    .single()
  return mapTourPlayerDayHandicap(throwOnErr('upsertTourPlayerDayHandicap', res) as unknown as Record<string, unknown>)
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export async function insertMatchplay(data: {
  season_id: string
  group_id: string
  player_a_id: string
  player_b_id: string
  result: 'win_a' | 'win_b' | 'draw'
  margin: string
  course_name: string
  played_at: string
}) {
  const res = await supabase
    .from('matchplay_results')
    .insert({
      season_id: data.season_id,
      group_id: data.group_id,
      player_a_id: data.player_a_id,
      player_b_id: data.player_b_id,
      result: data.result,
      margin: data.margin,
      course_name: data.course_name,
      played_at: data.played_at,
    })
    .select('*')
    .single()
  return mapMatchplayResult(throwOnErr('insertMatchplay', res) as unknown as Record<string, unknown>)
}

export async function insertActivityFeed(data: Omit<ActivityFeedItem, 'id' | 'created_at'>) {
  const res = await supabase
    .from('activity_feed')
    .insert({
      season_id: data.season_id,
      type: data.type,
      actor_id: data.actor_id,
      secondary_actor_id: data.secondary_actor_id ?? null,
      description: data.description,
      metadata: data.metadata,
    })
    .select('*')
    .single()
  return mapFeedItem(throwOnErr('insertActivityFeed', res) as unknown as Record<string, unknown>)
}

export async function insertStrokeplay(data: {
  player_id: string
  sub_season_id: string
  course_name: string
  played_at: string
  course_handicap: number
  gross_score: number
  net_score: number
  present_player_ids: string[]
}) {
  const res = await supabase
    .from('strokeplay_rounds')
    .insert({
      player_id: data.player_id,
      sub_season_id: data.sub_season_id,
      course_name: data.course_name,
      played_at: data.played_at,
      course_handicap: data.course_handicap,
      gross_score: data.gross_score,
      net_score: data.net_score,
      present_player_ids: data.present_player_ids,
      counts_for_ranking: true,
    })
    .select('*')
    .single()
  return mapStrokeplayRound(throwOnErr('insertStrokeplay', res) as unknown as Record<string, unknown>)
}

export async function insertWager(data: {
  proposer_id: string
  opponent_id: string
  amount: number
}) {
  const res = await supabase
    .from('wagers')
    .insert({
      proposer_id: data.proposer_id,
      opponent_id: data.opponent_id,
      amount: data.amount,
      status: 'pending_acceptance',
    })
    .select('*')
    .single()
  return mapWager(throwOnErr('insertWager', res) as unknown as Record<string, unknown>)
}

export async function updateWagerToActive(wagerId: string) {
  const res = await supabase.from('wagers').update({ status: 'active' }).eq('id', wagerId).select('*').single()
  return mapWager(throwOnErr('updateWagerToActive', res) as unknown as Record<string, unknown>)
}

export async function deleteWager(wagerId: string) {
  const res = await supabase.from('wagers').delete().eq('id', wagerId).select('id').maybeSingle()
  if (res.error) throw new Error(res.error.message)
  if (!res.data) {
    throw new Error(
      'Could not remove this wager. It may have already been accepted, or you may not have permission.',
    )
  }
}

export async function submitWagerOutcome(data: {
  wagerId: string
  resultWinnerId: string | null
  resultMargin: string
  resultCourse: string
  resultPlayedAt: string
}) {
  const res = await supabase.rpc('submit_wager_outcome', {
    p_wager_id: data.wagerId,
    p_result_winner_id: data.resultWinnerId,
    p_result_margin: data.resultMargin,
    p_result_course: data.resultCourse,
    p_result_played_at: data.resultPlayedAt,
  })
  if (res.error) throw new Error(res.error.message)
  const row = firstRpcRow(res.data)
  if (!row) throw new Error('submit_wager_outcome returned no row')
  return mapWager(row)
}

export async function confirmWagerOutcome(wagerId: string) {
  const res = await supabase.rpc('confirm_wager_outcome', { p_wager_id: wagerId })
  if (res.error) throw new Error(res.error.message)
  const row = firstRpcRow(res.data)
  if (!row) throw new Error('confirm_wager_outcome returned no row')
  return mapWager(row)
}

export async function disputeWagerOutcome(wagerId: string) {
  const res = await supabase.rpc('dispute_wager_outcome', { p_wager_id: wagerId })
  if (res.error) throw new Error(res.error.message)
  const row = firstRpcRow(res.data)
  if (!row) throw new Error('dispute_wager_outcome returned no row')
  return mapWager(row)
}

export async function reopenDisputedWager(wagerId: string) {
  const res = await supabase.rpc('reopen_disputed_wager', { p_wager_id: wagerId })
  if (res.error) throw new Error(res.error.message)
  const row = firstRpcRow(res.data)
  if (!row) throw new Error('reopen_disputed_wager returned no row')
  return mapWager(row)
}

export async function insertTeamWager(data: {
  created_by: string
  team_a_p1: string
  team_a_p2: string
  team_b_p1: string
  team_b_p2: string
  amount: number
}): Promise<TeamWager> {
  const res = await supabase
    .from('team_wagers')
    .insert({
      ...data,
      status: 'pending_acceptance',
    })
    .select('*')
    .single()
  return mapTeamWager(throwOnErr('insertTeamWager', res) as unknown as Record<string, unknown>)
}

export async function deleteTeamWager(teamWagerId: string) {
  const res = await supabase.from('team_wagers').delete().eq('id', teamWagerId).select('id').maybeSingle()
  if (res.error) throw new Error(res.error.message)
  if (!res.data) {
    throw new Error(
      'Could not remove this team wager. It may no longer be pending, or you may not have permission.',
    )
  }
}

export async function acceptTeamWager(teamWagerId: string) {
  const res = await supabase.rpc('accept_team_wager', { p_team_wager_id: teamWagerId })
  if (res.error) throw new Error(res.error.message)
  const row = firstRpcRow(res.data)
  if (!row) throw new Error('accept_team_wager returned no row')
  return mapTeamWager(row)
}

export async function submitTeamWagerOutcome(data: {
  teamWagerId: string
  resultWinnerTeam: 'a' | 'b' | null
  resultMargin: string
  resultCourse: string
  resultPlayedAt: string
}) {
  const res = await supabase.rpc('submit_team_wager_outcome', {
    p_team_wager_id: data.teamWagerId,
    p_result_winner_team: data.resultWinnerTeam,
    p_result_margin: data.resultMargin,
    p_result_course: data.resultCourse,
    p_result_played_at: data.resultPlayedAt,
  })
  if (res.error) throw new Error(res.error.message)
  const row = firstRpcRow(res.data)
  if (!row) throw new Error('submit_team_wager_outcome returned no row')
  return mapTeamWager(row)
}

export async function confirmTeamWagerOutcome(teamWagerId: string) {
  const res = await supabase.rpc('confirm_team_wager_outcome', { p_team_wager_id: teamWagerId })
  if (res.error) throw new Error(res.error.message)
  const row = firstRpcRow(res.data)
  if (!row) throw new Error('confirm_team_wager_outcome returned no row')
  return mapTeamWager(row)
}

export async function disputeTeamWagerOutcome(teamWagerId: string) {
  const res = await supabase.rpc('dispute_team_wager_outcome', { p_team_wager_id: teamWagerId })
  if (res.error) throw new Error(res.error.message)
  const row = firstRpcRow(res.data)
  if (!row) throw new Error('dispute_team_wager_outcome returned no row')
  return mapTeamWager(row)
}

export async function reopenDisputedTeamWager(teamWagerId: string) {
  const res = await supabase.rpc('reopen_disputed_team_wager', { p_team_wager_id: teamWagerId })
  if (res.error) throw new Error(res.error.message)
  const row = firstRpcRow(res.data)
  if (!row) throw new Error('reopen_disputed_team_wager returned no row')
  return mapTeamWager(row)
}

export async function upsertTourHoleScore(data: {
  match_id: string
  tour_player_id: string
  hole_number: number
  gross_score: number
  net_score: number
  stableford_points: number
}) {
  const row = {
    match_id: data.match_id,
    tour_player_id: data.tour_player_id,
    hole_number: data.hole_number,
    gross_score: data.gross_score,
    net_score: data.net_score,
    stableford_points: data.stableford_points,
  }
  const res = await supabase
    .from('tour_hole_scores')
    .upsert(row, { onConflict: 'match_id,tour_player_id,hole_number' })
    .select('*')
    .single()
  return mapTourHoleScore(throwOnErr('upsertTourHoleScore', res) as unknown as Record<string, unknown>)
}

export async function markNotificationRead(notificationId: string) {
  const res = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .select('*')
    .single()
  if (res.error) throw new Error(res.error.message)
  return mapNotification(res.data as Record<string, unknown>)
}

// ─── Admin (Tour) ─────────────────────────────────────────────────────────────

export async function insertTourEvent(data: { name: string; status: TourStatus; target_points: number }) {
  const row = await supabase.from('tour_events').insert(data).select('*').single()
  return mapTourEvent(throwOnErr('insertTourEvent', row) as unknown as Record<string, unknown>)
}

export async function updateTourEvent(
  id: string,
  patch: Partial<{ name: string; status: TourStatus; target_points: number }>
) {
  const res = await supabase.from('tour_events').update(patch).eq('id', id).select('*').maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ? mapTourEvent(res.data as Record<string, unknown>) : null
}

export async function insertTourPlayer(data: {
  tour_id: string
  player_id: string
  team: TourTeam
  locked_handicap: number
  seed: number
}) {
  const res = await supabase.from('tour_players').insert(data).select('*').single()
  return mapTourPlayer(throwOnErr('insertTourPlayer', res) as unknown as Record<string, unknown>)
}

export async function updateTourPlayer(
  id: string,
  patch: Partial<{ team: TourTeam; locked_handicap: number; seed: number }>
) {
  const res = await supabase.from('tour_players').update(patch).eq('id', id).select('*').maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ? mapTourPlayer(res.data as Record<string, unknown>) : null
}

export async function deleteTourPlayer(id: string) {
  const res = await supabase.from('tour_players').delete().eq('id', id)
  if (res.error) throw new Error(res.error.message)
}

export async function insertTourCourse(data: { tour_id: string; name: string }) {
  const res = await supabase.from('tour_courses').insert(data).select('*').single()
  return mapTourCourse(throwOnErr('insertTourCourse', res) as unknown as Record<string, unknown>)
}

export async function updateTourCourse(id: string, patch: Partial<{ name: string }>) {
  const res = await supabase.from('tour_courses').update(patch).eq('id', id).select('*').maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ? mapTourCourse(res.data as Record<string, unknown>) : null
}

export async function deleteTourCourse(id: string) {
  const res = await supabase.from('tour_courses').delete().eq('id', id)
  if (res.error) throw new Error(res.error.message)
}

/** Upsert a hole row (unique on course_id + hole_number). */
export async function upsertTourHole(data: {
  course_id: string
  hole_number: number
  par: number
  stroke_index: number
  yardage?: number | null
}) {
  const payload = {
    course_id: data.course_id,
    hole_number: data.hole_number,
    par: data.par,
    stroke_index: data.stroke_index,
    yardage: data.yardage === undefined ? null : data.yardage,
  }
  const res = await supabase.from('tour_holes').upsert(payload, { onConflict: 'course_id,hole_number' }).select('*').single()
  return mapTourHole(throwOnErr('upsertTourHole', res) as unknown as Record<string, unknown>)
}

/** Insert 18 placeholder holes (par 4, SI = hole) when the course has none. */
export async function seedTourHolesIfEmpty(courseId: string) {
  const existing = await fetchTourHolesForCourse(courseId)
  if (existing.length > 0) return existing
  const rows = Array.from({ length: 18 }, (_, i) => ({
    course_id: courseId,
    hole_number: i + 1,
    par: 4,
    stroke_index: i + 1,
    yardage: null as number | null,
  }))
  const res = await supabase.from('tour_holes').insert(rows).select('*')
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapTourHole)
}

export async function insertTourFormat(data: {
  name: string
  description?: string
  scoring_rules?: Record<string, unknown>
}) {
  const res = await supabase
    .from('tour_formats')
    .insert({
      name: data.name,
      description: data.description?.trim() ? data.description.trim() : null,
      scoring_rules: data.scoring_rules ?? {},
    })
    .select('*')
    .single()
  return mapTourFormat(throwOnErr('insertTourFormat', res) as unknown as Record<string, unknown>)
}

export async function updateTourFormat(
  id: string,
  patch: Partial<{ name: string; description: string; scoring_rules: Record<string, unknown> }>
) {
  const res = await supabase.from('tour_formats').update(patch).eq('id', id).select('*').maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ? mapTourFormat(res.data as Record<string, unknown>) : null
}

export async function deleteTourFormat(id: string) {
  const res = await supabase.from('tour_formats').delete().eq('id', id)
  if (res.error) throw new Error(res.error.message)
}

export async function insertTourDay(data: {
  tour_id: string
  day_number: number
  course_id: string
  format_id: string
  status: TourDayStatus
  played_at?: string | null
}) {
  const row = {
    tour_id: data.tour_id,
    day_number: data.day_number,
    course_id: data.course_id,
    format_id: data.format_id,
    status: data.status,
    played_at: data.played_at && data.played_at !== '' ? data.played_at : null,
  }
  const res = await supabase.from('tour_days').insert(row).select('*').single()
  return mapTourDay(throwOnErr('insertTourDay', res) as unknown as Record<string, unknown>)
}

export async function updateTourDay(
  id: string,
  patch: Partial<{
    course_id: string
    format_id: string
    status: TourDayStatus
    played_at: string | null
  }>
) {
  const res = await supabase.from('tour_days').update(patch).eq('id', id).select('*').maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ? mapTourDay(res.data as Record<string, unknown>) : null
}

export async function deleteTourDay(id: string) {
  const res = await supabase.from('tour_days').delete().eq('id', id)
  if (res.error) throw new Error(res.error.message)
}

export async function insertTourMatch(data: {
  tour_day_id: string
  team_a: TourTeam
  team_b: TourTeam
  status?: TourMatchStatus
  team_a_points?: number
  team_b_points?: number
}) {
  const res = await supabase
    .from('tour_matches')
    .insert({
      tour_day_id: data.tour_day_id,
      team_a: data.team_a,
      team_b: data.team_b,
      status: data.status ?? 'scheduled',
      team_a_points: data.team_a_points ?? 0,
      team_b_points: data.team_b_points ?? 0,
    })
    .select('*')
    .single()
  return mapTourMatch(throwOnErr('insertTourMatch', res) as unknown as Record<string, unknown>)
}

export async function updateTourMatch(
  id: string,
  patch: Partial<{
    team_a: TourTeam
    team_b: TourTeam
    status: TourMatchStatus
    team_a_points: number
    team_b_points: number
  }>
) {
  const res = await supabase.from('tour_matches').update(patch).eq('id', id).select('*').maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ? mapTourMatch(res.data as Record<string, unknown>) : null
}

export async function deleteTourMatch(id: string) {
  const res = await supabase.from('tour_matches').delete().eq('id', id)
  if (res.error) throw new Error(res.error.message)
}

export async function replaceTourMatchPlayers(
  matchId: string,
  rows: { tour_player_id: string; team: TourTeam; pair_index: 0 | 1 }[]
) {
  const del = await supabase.from('tour_match_players').delete().eq('match_id', matchId)
  if (del.error) throw new Error(del.error.message)
  if (rows.length === 0) return
  const ins = await supabase
    .from('tour_match_players')
    .insert(rows.map((r) => ({ match_id: matchId, ...r })))
  if (ins.error) throw new Error(ins.error.message)
}

// ─── Admin (RTD) ─────────────────────────────────────────────────────────────

export async function fetchStrokeplayForSubSeason(subSeasonId: string) {
  const res = await supabase.from('strokeplay_rounds').select('*').eq('sub_season_id', subSeasonId)
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapStrokeplayRound)
}

export async function fetchGroupsWithMembersForSeason(seasonId: string): Promise<{ group: Group; players: Profile[] }[]> {
  const groups = await fetchGroupsForSeason(seasonId)
  const out: { group: Group; players: Profile[] }[] = []
  for (const g of groups) {
    out.push({ group: g, players: await fetchPlayersInGroup(g.id) })
  }
  return out
}

/** Remove this player from every group in the season, then add them to `groupId`. */
export async function setPlayerGroupForSeason(seasonId: string, playerId: string, groupId: string) {
  const groups = await fetchGroupsForSeason(seasonId)
  const groupIds = groups.map((g) => g.id)
  if (groupIds.length === 0) throw new Error('No groups in this season')
  if (!groupIds.includes(groupId)) throw new Error('Group does not belong to this season')

  const del = await supabase.from('group_memberships').delete().eq('player_id', playerId).in('group_id', groupIds)
  if (del.error) throw new Error(del.error.message)

  const ins = await supabase.from('group_memberships').insert({ group_id: groupId, player_id: playerId })
  if (ins.error) throw new Error(ins.error.message)
}

export async function listAdminWalletLedger(): Promise<WalletTransaction[]> {
  const res = await supabase
    .from('wallet_transactions')
    .select('*')
    .in('type', ['admin_credit', 'admin_debit'])
    .order('created_at', { ascending: false })
  if (res.error) throw new Error(res.error.message)
  return (res.data as Record<string, unknown>[]).map(mapWalletTx)
}

function isRpcMissing(error: { message?: string; code?: string } | null): boolean {
  const msg = error?.message ?? ''
  return (
    error?.code === '42883' ||
    error?.code === 'PGRST202' ||
    msg.includes('does not exist') ||
    msg.includes('Could not find the function') ||
    msg.includes('schema cache')
  )
}

/**
 * Apply an admin credit: prefers DB RPC (atomic). If the RPC is not deployed, falls back to
 * insert + profile update (requires wallet "insert admin" policy in migrations).
 */
export async function adminApplyWalletCredit(playerId: string, amount: number, note?: string) {
  // DB function: public.admin_apply_wallet_credit(text, text, text) — text args so PostgREST matches reliably.
  const rpc = await supabase.rpc('admin_apply_wallet_credit', {
    p_amount: String(amount),
    p_note: note?.trim() ? note.trim() : '',
    p_player_id: playerId,
  })

  if (!rpc.error && rpc.data != null) {
    return rpc.data as string
  }

  if (rpc.error && !isRpcMissing(rpc.error) && rpc.error.message !== '') {
    throw new Error(rpc.error.message)
  }

  const ins = await supabase
    .from('wallet_transactions')
    .insert({
      player_id: playerId,
      amount,
      type: 'admin_credit',
      note: note?.trim() ? note.trim() : null,
    })
    .select('id')
    .single()

  if (ins.error) {
    throw new Error(
      ins.error.message +
        (rpc.error?.message
          ? ` (RPC: ${rpc.error.message})`
          : ' — deploy migration with admin_apply_wallet_credit or wallet insert policy for admins.')
    )
  }

  const txId = ins.data!.id as string

  const bal = await supabase.from('profiles').select('wallet_balance').eq('id', playerId).maybeSingle()
  if (bal.error) {
    await supabase.from('wallet_transactions').delete().eq('id', txId)
    throw new Error(bal.error.message)
  }
  if (!bal.data) {
    await supabase.from('wallet_transactions').delete().eq('id', txId)
    throw new Error('Player not found')
  }

  const next = Number(bal.data.wallet_balance) + amount
  const upd = await supabase.from('profiles').update({ wallet_balance: next }).eq('id', playerId)
  if (upd.error) {
    await supabase.from('wallet_transactions').delete().eq('id', txId)
    throw new Error(upd.error.message)
  }

  return txId
}

export async function insertKnockoutFixture(data: {
  season_id: string
  round: KnockoutRound
  slot_index: number
  player_a_id?: string | null
  player_b_id?: string | null
  result?: KnockoutFixture['result'] | null
  margin?: string | null
  course_name?: string | null
  played_at?: string | null
}) {
  const payload = {
    season_id: data.season_id,
    round: data.round,
    slot_index: data.slot_index,
    player_a_id: data.player_a_id ?? null,
    player_b_id: data.player_b_id ?? null,
    result: data.result ?? null,
    margin: data.margin != null && data.margin !== '' ? data.margin : null,
    course_name: data.course_name != null && data.course_name !== '' ? data.course_name : null,
    played_at: data.played_at != null && data.played_at !== '' ? data.played_at : null,
  }
  const res = await supabase.from('knockout_fixtures').insert(payload).select('*').single()
  return mapKnockoutFixture(throwOnErr('insertKnockoutFixture', res) as unknown as Record<string, unknown>)
}

export async function updateKnockoutFixture(
  id: string,
  patch: Partial<{
    round: KnockoutRound
    slot_index: number
    player_a_id: string | null
    player_b_id: string | null
    result: KnockoutFixture['result'] | null
    margin: string | null
    course_name: string | null
    played_at: string | null
  }>
) {
  const res = await supabase.from('knockout_fixtures').update(patch).eq('id', id).select('*').maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ? mapKnockoutFixture(res.data as Record<string, unknown>) : null
}

export async function deleteKnockoutFixture(id: string) {
  const res = await supabase.from('knockout_fixtures').delete().eq('id', id)
  if (res.error) throw new Error(res.error.message)
}

export async function updateSeason(
  seasonId: string,
  patch: Partial<{
    name: string
    year: number
    start_date: string
    end_date: string
    win_points: number
    draw_points: number
    loss_points: number
    is_active: boolean
  }>
) {
  const res = await supabase.from('seasons').update(patch).eq('id', seasonId).select('*').maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ? mapSeason(res.data as Record<string, unknown>) : null
}

export async function updateSubSeason(
  subSeasonId: string,
  patch: Partial<{
    name: string
    start_date: string
    end_date: string
    status: 'open' | 'closed'
    bonus_1st: number
    bonus_2nd: number
    bonus_3rd: number
    closed_at: string | null
  }>
) {
  const res = await supabase.from('sub_seasons').update(patch).eq('id', subSeasonId).select('*').maybeSingle()
  if (res.error) throw new Error(res.error.message)
  return res.data ? mapSubSeason(res.data as Record<string, unknown>) : null
}

/**
 * Replace bonus awards for a leg, mark it closed, open the next dated leg (if any).
 */
export async function closeBonusLegAndAssign(params: {
  subSeasonId: string
  seasonId: string
  awards: { player_id: string; position: 1 | 2 | 3; points_awarded: number }[]
}) {
  const { subSeasonId, seasonId, awards } = params
  const del = await supabase.from('bonus_point_awards').delete().eq('sub_season_id', subSeasonId)
  if (del.error) throw new Error(del.error.message)
  if (awards.length > 0) {
    const rows = awards.map((a) => ({
      sub_season_id: subSeasonId,
      player_id: a.player_id,
      position: a.position,
      points_awarded: a.points_awarded,
    }))
    const ins = await supabase.from('bonus_point_awards').insert(rows)
    if (ins.error) throw new Error(ins.error.message)
  }
  const cls = await supabase
    .from('sub_seasons')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', subSeasonId)
  if (cls.error) throw new Error(cls.error.message)
  const subs = await fetchSubSeasonsForSeason(seasonId)
  const sorted = [...subs].sort((a, b) => a.start_date.localeCompare(b.start_date))
  const idx = sorted.findIndex((s) => s.id === subSeasonId)
  const next = idx >= 0 ? sorted[idx + 1] : undefined
  if (next) {
    const op = await supabase.from('sub_seasons').update({ status: 'open' }).eq('id', next.id)
    if (op.error) throw new Error(op.error.message)
  }
}
