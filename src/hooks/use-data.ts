import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  fetchActiveSeason,
  listProfiles,
  getProfile,
  fetchGroupsForSeason,
  buildGroupStandings,
  buildAllGroupStandings,
  fetchMatchplayForGroup,
  fetchProfileMap,
  fetchUnplayedOpponentProfiles,
  fetchSubSeasonsForSeason,
  fetchStrokeplayForSubSeasons,
  fetchStrokeplayForPlayer,
  fetchBonusAwardsForSubSeasons,
  fetchKnockoutForSeason,
  listWagers,
  listWalletTransactions,
  fetchActivityFeedPage,
  listNotifications,
  countUnreadNotifications,
  fetchTourEvent,
  fetchTourPlayers,
  fetchTourCourses,
  fetchTourFormats,
  fetchTourDays,
  fetchTourMatchesForDay,
  fetchTourMatchPlayersForMatches,
  fetchTourHolesForCourse,
  fetchTourCourseById,
  fetchTourHoleScores,
  fetchTourChumpsPicks,
  fetchTourPlayerDayHandicapsForDay,
  upsertTourPlayerDayHandicap,
  fetchGroupForPlayer,
  fetchTourDayById,
  fetchTourFormatById,
  insertMatchplay,
  insertStrokeplay,
  insertActivityFeed,
  insertWager,
  updateWagerToActive,
  deleteWager,
  upsertTourHoleScore,
  markNotificationRead,
  closeBonusLegAndAssign,
  updateSeason,
  updateSubSeason,
  fetchGroupsWithMembersForSeason,
  fetchStrokeplayForSubSeason,
  setPlayerGroupForSeason,
  listAdminWalletLedger,
  adminApplyWalletCredit,
  insertKnockoutFixture,
  updateKnockoutFixture,
  deleteKnockoutFixture,
  seedTourHolesIfEmpty,
  upsertTourHole,
  insertTourEvent,
  updateTourEvent,
  insertTourPlayer,
  updateTourPlayer,
  deleteTourPlayer,
  insertTourCourse,
  updateTourCourse,
  deleteTourCourse,
  insertTourFormat,
  updateTourFormat,
  deleteTourFormat,
  insertTourDay,
  updateTourDay,
  deleteTourDay,
  insertTourMatch,
  updateTourMatch,
  deleteTourMatch,
  replaceTourMatchPlayers,
} from '@/lib/supabase/api'
import { getLadderSubSeasonId, getBestTwoRounds, ladderTotals } from '@/lib/bonus-ladder'
import { profileDisplayName } from '@/lib/format'
import type { Wager, WagerStatus, ActivityFeedItem, TourTeam, BonusLeagueEntry } from '@/lib/types'
import type { EnrichedWager, EnrichedMatchplayResult, EnrichedFeedItem } from '@/lib/types'

// ─── Season context ────────────────────────────────────────────────────────────

export function useActiveSeason() {
  return useQuery({
    queryKey: ['active-season'],
    queryFn: fetchActiveSeason,
  })
}

// ─── Players ───────────────────────────────────────────────────────────────────

export function usePlayers() {
  return useQuery({
    queryKey: ['players'],
    queryFn: listProfiles,
  })
}

export function usePlayer(id: string) {
  return useQuery({
    queryKey: ['player', id],
    queryFn: () => getProfile(id),
    enabled: !!id,
  })
}

// ─── Season & Groups ───────────────────────────────────────────────────────────

export function useGroups() {
  const { data: season } = useActiveSeason()
  return useQuery({
    queryKey: ['groups', season?.id],
    queryFn: () => fetchGroupsForSeason(season!.id),
    enabled: !!season?.id,
  })
}

export function useGroupForPlayer(playerId: string | undefined) {
  return useQuery({
    queryKey: ['group-for-player', playerId],
    queryFn: () => fetchGroupForPlayer(playerId!),
    enabled: !!playerId,
  })
}

export function useGroupStandings(groupId: string) {
  const { data: season } = useActiveSeason()
  return useQuery({
    queryKey: ['group-standings', groupId, season?.id],
    queryFn: () => buildGroupStandings(groupId, season!.id),
    enabled: !!season?.id && !!groupId,
  })
}

export function useAllGroupStandings() {
  const { data: season } = useActiveSeason()
  return useQuery({
    queryKey: ['all-group-standings', season?.id],
    queryFn: () => buildAllGroupStandings(season!.id),
    enabled: !!season?.id,
  })
}

// ─── Matchplay ─────────────────────────────────────────────────────────────────

export function useMatchplayResults(groupId?: string) {
  const { data: season } = useActiveSeason()
  return useQuery({
    queryKey: ['matchplay-results', groupId, season?.id],
    queryFn: async (): Promise<EnrichedMatchplayResult[]> => {
      const rows = await fetchMatchplayForGroup(groupId, season!.id)
      const ids = new Set<string>()
      rows.forEach((r) => {
        ids.add(r.player_a_id)
        ids.add(r.player_b_id)
      })
      const map = await fetchProfileMap([...ids])
      return rows.map((r) => ({
        ...r,
        player_a: map.get(r.player_a_id)!,
        player_b: map.get(r.player_b_id)!,
      }))
    },
    enabled: !!season?.id,
  })
}

export function useUnplayedOpponents(playerId: string, groupId: string) {
  return useQuery({
    queryKey: ['unplayed-opponents', playerId, groupId],
    queryFn: () => fetchUnplayedOpponentProfiles(playerId, groupId),
    enabled: !!playerId && !!groupId,
  })
}

// ─── Sub-Seasons & Bonus ────────────────────────────────────────────────────────

export function useSubSeasons() {
  const { data: season } = useActiveSeason()
  return useQuery({
    queryKey: ['sub-seasons', season?.id],
    queryFn: () => fetchSubSeasonsForSeason(season!.id),
    enabled: !!season?.id,
  })
}

export function useOpenSubSeasons() {
  const { data: season } = useActiveSeason()
  return useQuery({
    queryKey: ['open-sub-seasons', season?.id],
    queryFn: async () => {
      const subs = await fetchSubSeasonsForSeason(season!.id)
      return subs.filter((ss) => ss.status === 'open')
    },
    enabled: !!season?.id,
  })
}

export function useBonusPointAwards() {
  const { data: season } = useActiveSeason()
  return useQuery({
    queryKey: ['bonus-point-awards', season?.id],
    queryFn: async () => {
      const subs = await fetchSubSeasonsForSeason(season!.id)
      return fetchBonusAwardsForSubSeasons(subs.map((s) => s.id))
    },
    enabled: !!season?.id,
  })
}

export function useBonusLeague() {
  const { data: season } = useActiveSeason()
  return useQuery({
    queryKey: ['bonus-league', season?.id],
    queryFn: async (): Promise<BonusLeagueEntry[]> => {
      const players = await listProfiles()
      const subs = await fetchSubSeasonsForSeason(season!.id)
      const legId = getLadderSubSeasonId(subs)
      const ssIds = subs.map((s) => s.id)
      const allRounds = await fetchStrokeplayForSubSeasons(ssIds)
      const bonusAwards = await fetchBonusAwardsForSubSeasons(ssIds)
      const bonusMap: Record<string, number> = {}
      bonusAwards.forEach((a) => {
        bonusMap[a.player_id] = (bonusMap[a.player_id] ?? 0) + a.points_awarded
      })

      const rows: Omit<BonusLeagueEntry, 'rank'>[] = players.map((player) => {
        const rounds = legId
          ? allRounds.filter((r) => r.player_id === player.id && r.sub_season_id === legId)
          : []
        const { r1, r2 } = getBestTwoRounds(rounds)
        const total_net = ladderTotals(r1, r2)
        return {
          player,
          rounds,
          r1_gross: r1?.gross_score,
          r1_net: r1?.net_score,
          r2_gross: r2?.gross_score,
          r2_net: r2?.net_score,
          total_net,
          bonus_points: bonusMap[player.id] ?? 0,
        }
      })

      return rows
        .sort((a, b) => {
          const an = a.total_net
          const bn = b.total_net
          if (an === undefined && bn === undefined) return 0
          if (an === undefined) return 1
          if (bn === undefined) return -1
          return an - bn
        })
        .map((e, i) => ({ ...e, rank: i + 1 }))
    },
    enabled: !!season?.id,
  })
}

export function useGroupsWithMembers() {
  const { data: season } = useActiveSeason()
  return useQuery({
    queryKey: ['groups-with-members', season?.id],
    queryFn: () => fetchGroupsWithMembersForSeason(season!.id),
    enabled: !!season?.id,
  })
}

export function useStrokeplayRoundsForSubSeason(subSeasonId: string | undefined) {
  return useQuery({
    queryKey: ['strokeplay-sub', subSeasonId],
    queryFn: () => fetchStrokeplayForSubSeason(subSeasonId!),
    enabled: !!subSeasonId,
  })
}

export function useCloseBonusLeg() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: closeBonusLegAndAssign,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub-seasons'] })
      qc.invalidateQueries({ queryKey: ['bonus-league'] })
      qc.invalidateQueries({ queryKey: ['bonus-point-awards'] })
      qc.invalidateQueries({ queryKey: ['all-group-standings'] })
      qc.invalidateQueries({ queryKey: ['active-season'] })
    },
  })
}

export function useUpdateSeason() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ seasonId, patch }: { seasonId: string; patch: Parameters<typeof updateSeason>[1] }) =>
      updateSeason(seasonId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['active-season'] })
    },
  })
}

export function useUpdateSubSeason() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      subSeasonId,
      patch,
    }: {
      subSeasonId: string
      patch: Parameters<typeof updateSubSeason>[1]
    }) => updateSubSeason(subSeasonId, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub-seasons'] })
      qc.invalidateQueries({ queryKey: ['bonus-league'] })
    },
  })
}

export function useSetPlayerGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { seasonId: string; playerId: string; groupId: string }) =>
      setPlayerGroupForSeason(args.seasonId, args.playerId, args.groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups-with-members'] })
      qc.invalidateQueries({ queryKey: ['all-group-standings'] })
      qc.invalidateQueries({ queryKey: ['group-for-player'] })
    },
  })
}

export function useAdminWalletLedger() {
  return useQuery({
    queryKey: ['admin-wallet-ledger'],
    queryFn: listAdminWalletLedger,
  })
}

export function useApplyAdminWalletCredit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { playerId: string; amount: number; note?: string }) =>
      adminApplyWalletCredit(args.playerId, args.amount, args.note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-wallet-ledger'] })
      qc.invalidateQueries({ queryKey: ['players'] })
      qc.invalidateQueries({ queryKey: ['wallet-balance'] })
      qc.invalidateQueries({ queryKey: ['wallet-transactions'] })
    },
  })
}

export function useInsertKnockoutFixture() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: insertKnockoutFixture,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knockout-bracket'] }),
  })
}

export function useUpdateKnockoutFixture() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; patch: Parameters<typeof updateKnockoutFixture>[1] }) =>
      updateKnockoutFixture(args.id, args.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knockout-bracket'] }),
  })
}

export function useDeleteKnockoutFixture() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteKnockoutFixture,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knockout-bracket'] }),
  })
}

export function usePlayerRounds(playerId: string) {
  return useQuery({
    queryKey: ['player-rounds', playerId],
    queryFn: () => fetchStrokeplayForPlayer(playerId),
    enabled: !!playerId,
  })
}

// ─── Knockout ─────────────────────────────────────────────────────────────────

export function useKnockoutBracket() {
  const { data: season } = useActiveSeason()
  return useQuery({
    queryKey: ['knockout-bracket', season?.id],
    queryFn: async () => {
      const fixtures = await fetchKnockoutForSeason(season!.id)
      const ids = new Set<string>()
      fixtures.forEach((f) => {
        if (f.player_a_id) ids.add(f.player_a_id)
        if (f.player_b_id) ids.add(f.player_b_id)
      })
      const map = await fetchProfileMap([...ids])
      return fixtures.map((f) => ({
        ...f,
        player_a: f.player_a_id ? map.get(f.player_a_id) : undefined,
        player_b: f.player_b_id ? map.get(f.player_b_id) : undefined,
      }))
    },
    enabled: !!season?.id,
  })
}

// ─── Wagers ───────────────────────────────────────────────────────────────────

async function enrichWagers(wagers: Wager[]): Promise<EnrichedWager[]> {
  const ids = new Set<string>()
  wagers.forEach((w) => {
    ids.add(w.proposer_id)
    ids.add(w.opponent_id)
    if (w.result_winner_id) ids.add(w.result_winner_id)
  })
  const map = await fetchProfileMap([...ids])
  return wagers.map((w) => ({
    ...w,
    proposer: map.get(w.proposer_id)!,
    opponent: map.get(w.opponent_id)!,
    result_winner: w.result_winner_id ? map.get(w.result_winner_id) : undefined,
  }))
}

export function useWagers(playerId?: string, statusFilter?: WagerStatus[]) {
  return useQuery({
    queryKey: ['wagers', playerId, statusFilter],
    queryFn: async () => {
      const rows = await listWagers(playerId, statusFilter)
      return enrichWagers(rows)
    },
  })
}

export function useWalletBalance(playerId: string) {
  return useQuery({
    queryKey: ['wallet-balance', playerId],
    queryFn: async () => {
      const p = await getProfile(playerId)
      return p?.wallet_balance ?? 0
    },
    enabled: !!playerId,
  })
}

export function useWalletTransactions(playerId: string) {
  return useQuery({
    queryKey: ['wallet-transactions', playerId],
    queryFn: () => listWalletTransactions(playerId),
    enabled: !!playerId,
  })
}

export function useCreateWager() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: insertWager,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wagers'] }),
  })
}

export function useAcceptWager() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateWagerToActive,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wagers'] }),
  })
}

export function useDeclineWager() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteWager,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wagers'] }),
  })
}

// ─── Activity Feed ─────────────────────────────────────────────────────────────

export function useActivityFeed(page = 0) {
  const { data: season } = useActiveSeason()
  return useQuery({
    queryKey: ['activity-feed', page, season?.id],
    queryFn: async () => {
      const { items, hasMore, total } = await fetchActivityFeedPage(season!.id, page)
      const ids = new Set<string>()
      items.forEach((it) => {
        ids.add(it.actor_id)
        if (it.secondary_actor_id) ids.add(it.secondary_actor_id)
      })
      const map = await fetchProfileMap([...ids])
      const enriched: EnrichedFeedItem[] = items.map((item) => ({
        ...item,
        actor: map.get(item.actor_id)!,
        secondary_actor: item.secondary_actor_id ? map.get(item.secondary_actor_id) : undefined,
      }))
      return { items: enriched, hasMore, total }
    },
    enabled: !!season?.id,
  })
}

export function useAddFeedItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (item: Omit<ActivityFeedItem, 'id' | 'created_at'>) => insertActivityFeed(item),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity-feed'] }),
  })
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export function useNotifications(playerId: string) {
  return useQuery({
    queryKey: ['notifications', playerId],
    queryFn: () => listNotifications(playerId),
    enabled: !!playerId,
  })
}

export function useUnreadCount(playerId: string) {
  return useQuery({
    queryKey: ['unread-count', playerId],
    queryFn: () => countUnreadNotifications(playerId),
    enabled: !!playerId,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      notificationId,
      playerId,
    }: {
      notificationId: string
      playerId: string
    }) => {
      await markNotificationRead(notificationId)
      return playerId
    },
    onSuccess: (playerId) => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['unread-count', playerId] })
    },
  })
}

// ─── Tour ─────────────────────────────────────────────────────────────────────

export function useTourEvent() {
  return useQuery({
    queryKey: ['tour-event'],
    queryFn: fetchTourEvent,
  })
}

export function useTourPlayers() {
  const { data: ev } = useTourEvent()
  return useQuery({
    queryKey: ['tour-players', ev?.id],
    queryFn: async () => {
      const tps = await fetchTourPlayers(ev!.id)
      const map = await fetchProfileMap(tps.map((tp) => tp.player_id))
      return tps.map((tp) => ({
        ...tp,
        profile: map.get(tp.player_id)!,
      }))
    },
    enabled: !!ev?.id,
  })
}

export function useTourDays() {
  const { data: ev } = useTourEvent()
  return useQuery({
    queryKey: ['tour-days', ev?.id],
    queryFn: async () => {
      const days = await fetchTourDays(ev!.id)
      const formats = await fetchTourFormats()
      const formatMap = new Map(formats.map((f) => [f.id, f]))
      const courses = await fetchTourCourses(ev!.id)
      const courseMap = new Map(courses.map((c) => [c.id, c]))
      return days.map((d) => ({
        ...d,
        format: formatMap.get(d.format_id)!,
        course: courseMap.get(d.course_id)!,
      }))
    },
    enabled: !!ev?.id,
  })
}

export function useTourDayMatches(dayId: string) {
  return useQuery({
    queryKey: ['tour-day-matches', dayId],
    queryFn: async () => {
      const dayRow = await fetchTourDayById(dayId)
      if (!dayRow) return []
      const [format, course] = await Promise.all([
        fetchTourFormatById(dayRow.format_id),
        fetchTourCourseById(dayRow.course_id),
      ])
      if (!format || !course) return []

      const matches = await fetchTourMatchesForDay(dayId)
      const matchIds = matches.map((m) => m.id)
      const mps = await fetchTourMatchPlayersForMatches(matchIds)
      const ev = await fetchTourEvent()
      const tps = ev ? await fetchTourPlayers(ev.id) : []
      const tpMap = new Map(tps.map((tp) => [tp.id, tp]))
      const profileIds = [...new Set(tps.map((tp) => tp.player_id))]
      const profiles = await fetchProfileMap(profileIds)
      const dayHandicaps = await fetchTourPlayerDayHandicapsForDay(dayId)
      const dayHcByPlayer = new Map(dayHandicaps.map((h) => [h.tour_player_id, h.course_handicap]))

      const day = { ...dayRow, format, course }

      return matches.map((match) => {
        const mpsFor = mps.filter((mp) => mp.match_id === match.id)
        const buildSide = (team: TourTeam) =>
          mpsFor
            .filter((mp) => mp.team === team)
            .map((mp) => {
              const tp = tpMap.get(mp.tour_player_id)
              if (!tp) throw new Error('tour_player missing')
              const course_handicap_day = dayHcByPlayer.get(tp.id) ?? tp.locked_handicap
              return {
                ...tp,
                profile: profiles.get(tp.player_id)!,
                pair_index: mp.pair_index,
                course_handicap_day,
              }
            })

        return {
          ...match,
          players_a: buildSide(match.team_a),
          players_b: buildSide(match.team_b),
          day,
          format,
        }
      })
    },
    enabled: !!dayId,
  })
}

export function useTourHoleScores(matchId: string) {
  return useQuery({
    queryKey: ['tour-hole-scores', matchId],
    queryFn: () => fetchTourHoleScores(matchId),
    enabled: !!matchId,
  })
}

export function useSaveTourHoleScore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertTourHoleScore,
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['tour-hole-scores', vars.match_id] }),
  })
}

export function useTourLeaderboard() {
  const { data: ev } = useTourEvent()
  return useQuery({
    queryKey: ['tour-leaderboard', ev?.id],
    queryFn: async () => {
      const days = await fetchTourDays(ev!.id)
      const d1 = days.find((d) => d.day_number === 1)
      const d2 = days.find((d) => d.day_number === 2)
      const m1 = d1 ? await fetchTourMatchesForDay(d1.id) : []
      const m2 = d2 ? await fetchTourMatchesForDay(d2.id) : []

      const sumComplete = (matches: typeof m1) => {
        let s93 = 0
        let s91 = 0
        for (const m of matches.filter((x) => x.status === 'complete')) {
          if (m.team_a === '93s') {
            s93 += m.team_a_points
            s91 += m.team_b_points
          } else {
            s91 += m.team_a_points
            s93 += m.team_b_points
          }
        }
        return { '93s': s93, '91s': s91 }
      }

      const day1Score = sumComplete(m1)
      const day2Score = sumComplete(m2)

      return {
        '93s': {
          day1: day1Score['93s'],
          day2: day2Score['93s'],
          total: day1Score['93s'] + day2Score['93s'],
        },
        '91s': {
          day1: day1Score['91s'],
          day2: day2Score['91s'],
          total: day1Score['91s'] + day2Score['91s'],
        },
        target: ev!.target_points,
      }
    },
    enabled: !!ev?.id,
  })
}

export function useTourGreenJacket() {
  const { data: ev } = useTourEvent()
  return useQuery({
    queryKey: ['tour-green-jacket', ev?.id],
    queryFn: async () => {
      const tps = await fetchTourPlayers(ev!.id)
      const days = await fetchTourDays(ev!.id)
      const d1 = days.find((d) => d.day_number === 1)
      const matches = d1 ? await fetchTourMatchesForDay(d1.id).then((ms) => ms.filter((m) => m.status === 'complete')) : []
      const matchIds = matches.map((m) => m.id)
      const mps = matchIds.length ? await fetchTourMatchPlayersForMatches(matchIds) : []
      const tpLookup = new Map<string, (typeof mps)[0]>()
      for (const mp of mps) {
        tpLookup.set(`${mp.match_id}:${mp.tour_player_id}`, mp)
      }

      const profiles = await fetchProfileMap(tps.map((tp) => tp.player_id))

      const rows = tps
        .map((tp) => {
          let day1Points = 0
          for (const m of matches) {
            const mp = tpLookup.get(`${m.id}:${tp.id}`)
            if (!mp) continue
            day1Points += mp.team === m.team_a ? m.team_a_points : m.team_b_points
          }
          return {
            tour_player: tp,
            profile: profiles.get(tp.player_id)!,
            day_points: [
              { day: 1, points: day1Points },
              { day: 2, points: 0 },
              { day: 3, points: 0 },
            ],
            total_points: day1Points,
            rank: 0,
          }
        })
        .sort((a, b) => b.total_points - a.total_points)
        .map((entry, i) => ({ ...entry, rank: i + 1 }))

      return rows
    },
    enabled: !!ev?.id,
  })
}

export function useTourHoles() {
  const { data: ev } = useTourEvent()
  return useQuery({
    queryKey: ['tour-holes', ev?.id],
    queryFn: async () => {
      const days = await fetchTourDays(ev!.id)
      const first = days[0]
      if (!first) return []
      return fetchTourHolesForCourse(first.course_id)
    },
    enabled: !!ev?.id,
  })
}

/** Holes for a specific course (e.g. the course assigned to the match day). */
export function useTourHolesForCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ['tour-holes-course', courseId],
    queryFn: () => fetchTourHolesForCourse(courseId!),
    enabled: !!courseId,
  })
}

function invalidateTourAdminCaches(qc: QueryClient) {
  const prefixes = [
    'tour-event',
    'tour-players',
    'tour-days',
    'tour-formats',
    'tour-courses-admin',
    'tour-matches-day',
    'tour-day-matches',
    'tour-holes',
    'tour-holes-course',
    'tour-leaderboard',
    'tour-chumps',
    'tour-green-jacket',
    'tour-player-day-hc',
  ] as const
  for (const p of prefixes) {
    qc.invalidateQueries({ queryKey: [p] })
  }
}

export function useTourFormatsCatalog() {
  return useQuery({
    queryKey: ['tour-formats'],
    queryFn: fetchTourFormats,
  })
}

export function useTourCoursesForAdmin() {
  const { data: ev } = useTourEvent()
  return useQuery({
    queryKey: ['tour-courses-admin', ev?.id],
    queryFn: () => fetchTourCourses(ev!.id),
    enabled: !!ev?.id,
  })
}

export function useTourCourseByIdQuery(courseId: string | undefined) {
  return useQuery({
    queryKey: ['tour-course', courseId],
    queryFn: () => fetchTourCourseById(courseId!),
    enabled: !!courseId,
  })
}

export function useTourMatchesForDay(dayId: string | undefined) {
  return useQuery({
    queryKey: ['tour-matches-day', dayId],
    queryFn: () => fetchTourMatchesForDay(dayId!),
    enabled: !!dayId,
  })
}

export function useTourMatchPlayersBatch(matchIds: string[]) {
  const key = [...matchIds].sort().join(',')
  return useQuery({
    queryKey: ['tour-match-players', key],
    queryFn: () => fetchTourMatchPlayersForMatches(matchIds),
    enabled: matchIds.length > 0,
  })
}

export function useTourPlayerDayHandicapsQuery(dayId: string | undefined) {
  return useQuery({
    queryKey: ['tour-player-day-hc', dayId],
    queryFn: () => fetchTourPlayerDayHandicapsForDay(dayId!),
    enabled: !!dayId,
  })
}

export function useUpsertTourPlayerDayHandicap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertTourPlayerDayHandicap,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tour-day-matches'] })
      qc.invalidateQueries({ queryKey: ['tour-player-day-hc'] })
    },
  })
}

export function useInsertTourEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: insertTourEvent,
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useUpdateTourEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateTourEvent>[1] }) => updateTourEvent(id, patch),
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useInsertTourPlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: insertTourPlayer,
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useUpdateTourPlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateTourPlayer>[1] }) =>
      updateTourPlayer(id, patch),
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useDeleteTourPlayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTourPlayer,
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useInsertTourCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: insertTourCourse,
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useUpdateTourCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateTourCourse>[1] }) =>
      updateTourCourse(id, patch),
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useDeleteTourCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTourCourse,
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useUpsertTourHoleMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertTourHole,
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useSeedTourHoles() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: seedTourHolesIfEmpty,
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useInsertTourFormatMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: insertTourFormat,
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useUpdateTourFormatMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateTourFormat>[1] }) =>
      updateTourFormat(id, patch),
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useDeleteTourFormatMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTourFormat,
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useInsertTourDayMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: insertTourDay,
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useUpdateTourDayMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateTourDay>[1] }) =>
      updateTourDay(id, patch),
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useDeleteTourDayMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTourDay,
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useInsertTourMatchMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: insertTourMatch,
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useUpdateTourMatchMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateTourMatch>[1] }) =>
      updateTourMatch(id, patch),
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useDeleteTourMatchMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTourMatch,
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}

export function useReplaceTourMatchPlayers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ matchId, rows }: { matchId: string; rows: Parameters<typeof replaceTourMatchPlayers>[1] }) =>
      replaceTourMatchPlayers(matchId, rows),
    onSuccess: () => invalidateTourAdminCaches(qc),
  })
}


export function useTourChumps() {
  const { data: ev } = useTourEvent()
  return useQuery({
    queryKey: ['tour-chumps', ev?.id],
    queryFn: async () => {
      const picks = await fetchTourChumpsPicks(ev!.id)
      const tps = await fetchTourPlayers(ev!.id)
      const tpMap = new Map(tps.map((tp) => [tp.id, tp]))
      const profileIds = [...new Set(tps.map((tp) => tp.player_id))]
      const profiles = await fetchProfileMap(profileIds)

      return picks.map((pick) => {
        const picker = profiles.get(pick.picker_id)!
        const pickIds = [pick.pick_1_id, pick.pick_2_id, pick.pick_3_id, pick.pick_4_id]
        const picksEnriched = pickIds.map((id) => {
          const tp = tpMap.get(id)!
          return { ...tp, profile: profiles.get(tp.player_id)! }
        })
        const captainTp = tpMap.get(pick.captain_id)!
        const captain = { ...captainTp, profile: profiles.get(captainTp.player_id)! }
        return {
          pick,
          picker,
          picks: picksEnriched,
          captain,
          total_points: 0,
          rank: 0,
        }
      }).map((entry, i) => ({ ...entry, rank: i + 1 }))
    },
    enabled: !!ev?.id,
  })
}

// ─── Matchplay mutation ─────────────────────────────────────────────────────────

export function useSubmitMatchplay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      player_a_id: string
      player_b_id: string
      group_id: string
      result: 'win_a' | 'win_b' | 'draw'
      margin: string
      course_name: string
      played_at: string
    }) => {
      const season = await fetchActiveSeason()
      if (!season) throw new Error('No active season')
      const row = await insertMatchplay({
        ...data,
        season_id: season.id,
      })

      const profiles = await fetchProfileMap([data.player_a_id, data.player_b_id])
      const a = profiles.get(data.player_a_id)!
      const b = profiles.get(data.player_b_id)!

      await insertActivityFeed({
        season_id: season.id,
        type: 'matchplay',
        actor_id: data.player_a_id,
        secondary_actor_id: data.player_b_id,
        description: `${profileDisplayName(a)} vs ${profileDisplayName(b)} at ${data.course_name}`,
        metadata: { result: data.result, margin: data.margin, course: data.course_name },
      })

      return row
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matchplay-results'] })
      qc.invalidateQueries({ queryKey: ['all-group-standings'] })
      qc.invalidateQueries({ queryKey: ['group-standings'] })
      qc.invalidateQueries({ queryKey: ['activity-feed'] })
    },
  })
}

export function useSubmitStrokeplay() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      player_id: string
      sub_season_id: string
      course_name: string
      played_at: string
      course_handicap: number
      gross_score: number
    }) => {
      const season = await fetchActiveSeason()
      if (!season) throw new Error('No active season')
      const net_score = data.gross_score - data.course_handicap
      const row = await insertStrokeplay({
        ...data,
        net_score,
      })

      const self = await getProfile(data.player_id)
      if (self) {
        await insertActivityFeed({
          season_id: season.id,
          type: 'strokeplay',
          actor_id: data.player_id,
          description: `${profileDisplayName(self)} shot a net ${net_score} at ${data.course_name}`,
          metadata: { net_score, course: data.course_name },
        })
      }

      return row
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player-rounds'] })
      qc.invalidateQueries({ queryKey: ['bonus-league'] })
      qc.invalidateQueries({ queryKey: ['activity-feed'] })
    },
  })
}
