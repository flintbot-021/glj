import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  PLAYERS,
  GROUPS,
  MATCHPLAY_RESULTS,
  SUB_SEASONS,
  STROKEPLAY_ROUNDS,
  BONUS_POINT_AWARDS,
  KNOCKOUT_FIXTURES,
  WAGERS,
  WALLET_TRANSACTIONS,
  ACTIVITY_FEED,
  NOTIFICATIONS,
  TOUR_EVENT,
  TOUR_PLAYERS,
  TOUR_COURSE,
  TOUR_HOLES,
  TOUR_FORMATS,
  TOUR_DAYS,
  TOUR_MATCHES,
  TOUR_MATCH_PLAYERS,
  TOUR_CHUMPS_PICKS,
  getPlayer,
  getPlayersInGroup,
} from '@/lib/mock-data'
import { computeGroupStandings } from '@/lib/scoring'
import type { Wager, WagerStatus, ActivityFeedItem, TourHoleScore } from '@/lib/types'

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

// ─── Players ───────────────────────────────────────────────────────────────────

export function usePlayers() {
  return useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      await delay()
      return PLAYERS
    },
  })
}

export function usePlayer(id: string) {
  return useQuery({
    queryKey: ['player', id],
    queryFn: async () => {
      await delay(100)
      return getPlayer(id)
    },
  })
}

// ─── Season & Groups ───────────────────────────────────────────────────────────

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      await delay()
      return GROUPS
    },
  })
}

export function useGroupStandings(groupId: string) {
  return useQuery({
    queryKey: ['group-standings', groupId],
    queryFn: async () => {
      await delay()
      const players = getPlayersInGroup(groupId)
      const results = MATCHPLAY_RESULTS.filter((r) => r.group_id === groupId)
      const bonusMap: Record<string, number> = {}

      BONUS_POINT_AWARDS.forEach((award) => {
        bonusMap[award.player_id] = (bonusMap[award.player_id] ?? 0) + award.points_awarded
      })

      return computeGroupStandings(players, results, bonusMap)
    },
  })
}

export function useAllGroupStandings() {
  return useQuery({
    queryKey: ['all-group-standings'],
    queryFn: async () => {
      await delay()
      const bonusMap: Record<string, number> = {}
      BONUS_POINT_AWARDS.forEach((award) => {
        bonusMap[award.player_id] = (bonusMap[award.player_id] ?? 0) + award.points_awarded
      })

      return GROUPS.map((group) => {
        const players = getPlayersInGroup(group.id)
        const results = MATCHPLAY_RESULTS.filter((r) => r.group_id === group.id)
        const standings = computeGroupStandings(players, results, bonusMap)
        return { group, standings }
      })
    },
  })
}

// ─── Matchplay ─────────────────────────────────────────────────────────────────

export function useMatchplayResults(groupId?: string) {
  return useQuery({
    queryKey: ['matchplay-results', groupId],
    queryFn: async () => {
      await delay()
      const results = groupId
        ? MATCHPLAY_RESULTS.filter((r) => r.group_id === groupId)
        : MATCHPLAY_RESULTS
      return results.map((r) => ({
        ...r,
        player_a: getPlayer(r.player_a_id),
        player_b: getPlayer(r.player_b_id),
      }))
    },
  })
}

export function useUnplayedOpponents(playerId: string, groupId: string) {
  return useQuery({
    queryKey: ['unplayed-opponents', playerId, groupId],
    queryFn: async () => {
      await delay(100)
      const groupPlayers = getPlayersInGroup(groupId).filter((p) => p.id !== playerId)
      const playedIds = MATCHPLAY_RESULTS.filter(
        (r) =>
          r.group_id === groupId &&
          (r.player_a_id === playerId || r.player_b_id === playerId)
      ).map((r) => (r.player_a_id === playerId ? r.player_b_id : r.player_a_id))

      return groupPlayers.filter((p) => !playedIds.includes(p.id))
    },
  })
}

// ─── Sub-Seasons & Bonus ───────────────────────────────────────────────────────

export function useSubSeasons() {
  return useQuery({
    queryKey: ['sub-seasons'],
    queryFn: async () => {
      await delay()
      return SUB_SEASONS
    },
  })
}

export function useOpenSubSeasons() {
  return useQuery({
    queryKey: ['open-sub-seasons'],
    queryFn: async () => {
      await delay(100)
      return SUB_SEASONS.filter((ss) => ss.status === 'open')
    },
  })
}

export function useBonusLeague() {
  return useQuery({
    queryKey: ['bonus-league'],
    queryFn: async () => {
      await delay()
      return PLAYERS.map((player) => {
        const allRounds = STROKEPLAY_ROUNDS.filter((r) => r.player_id === player.id)
        const bonus = BONUS_POINT_AWARDS.filter((a) => a.player_id === player.id).reduce(
          (sum, a) => sum + a.points_awarded,
          0
        )

        const sorted = [...allRounds].sort((a, b) => a.net_score - b.net_score)
        return {
          player,
          rounds: allRounds,
          best_net: sorted[0]?.net_score,
          second_best_net: sorted[1]?.net_score,
          bonus_points: bonus,
        }
      }).sort((a, b) => {
        if (a.best_net === undefined && b.best_net === undefined) return 0
        if (a.best_net === undefined) return 1
        if (b.best_net === undefined) return -1
        return a.best_net - b.best_net
      })
    },
  })
}

export function usePlayerRounds(playerId: string) {
  return useQuery({
    queryKey: ['player-rounds', playerId],
    queryFn: async () => {
      await delay()
      return STROKEPLAY_ROUNDS.filter((r) => r.player_id === playerId)
    },
  })
}

// ─── Knockout ──────────────────────────────────────────────────────────────────

export function useKnockoutBracket() {
  return useQuery({
    queryKey: ['knockout-bracket'],
    queryFn: async () => {
      await delay()
      return KNOCKOUT_FIXTURES.map((f) => ({
        ...f,
        player_a: f.player_a_id ? getPlayer(f.player_a_id) : undefined,
        player_b: f.player_b_id ? getPlayer(f.player_b_id) : undefined,
      }))
    },
  })
}

// ─── Wagers ────────────────────────────────────────────────────────────────────

// In-memory wager state for mutations
let wagersState = [...WAGERS]

export function useWagers(playerId?: string, statusFilter?: WagerStatus[]) {
  return useQuery({
    queryKey: ['wagers', playerId, statusFilter],
    queryFn: async () => {
      await delay()
      let filtered = playerId
        ? wagersState.filter((w) => w.proposer_id === playerId || w.opponent_id === playerId)
        : wagersState

      if (statusFilter && statusFilter.length > 0) {
        filtered = filtered.filter((w) => statusFilter.includes(w.status))
      }

      return filtered.map((w) => ({
        ...w,
        proposer: getPlayer(w.proposer_id),
        opponent: getPlayer(w.opponent_id),
        result_winner: w.result_winner_id ? getPlayer(w.result_winner_id) : undefined,
      })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    },
  })
}

export function useWalletBalance(playerId: string) {
  return useQuery({
    queryKey: ['wallet-balance', playerId],
    queryFn: async () => {
      await delay(100)
      return getPlayer(playerId)?.wallet_balance ?? 0
    },
  })
}

export function useWalletTransactions(playerId: string) {
  return useQuery({
    queryKey: ['wallet-transactions', playerId],
    queryFn: async () => {
      await delay()
      return WALLET_TRANSACTIONS.filter((t) => t.player_id === playerId).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    },
  })
}

export function useCreateWager() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { proposer_id: string; opponent_id: string; amount: number }) => {
      await delay(500)
      const newWager: Wager = {
        id: `w${Date.now()}`,
        proposer_id: data.proposer_id,
        opponent_id: data.opponent_id,
        amount: data.amount,
        status: 'pending_acceptance',
        proposer_confirmed: false,
        opponent_confirmed: false,
        created_at: new Date().toISOString(),
      }
      wagersState = [newWager, ...wagersState]
      return newWager
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wagers'] }),
  })
}

export function useAcceptWager() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (wagerId: string) => {
      await delay(300)
      wagersState = wagersState.map((w) =>
        w.id === wagerId ? { ...w, status: 'active' as const } : w
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wagers'] }),
  })
}

export function useDeclineWager() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (wagerId: string) => {
      await delay(300)
      wagersState = wagersState.filter((w) => w.id !== wagerId)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wagers'] }),
  })
}

// ─── Activity Feed ─────────────────────────────────────────────────────────────

let feedState = [...ACTIVITY_FEED]

export function useActivityFeed(page = 0) {
  const PAGE_SIZE = 10
  return useQuery({
    queryKey: ['activity-feed', page],
    queryFn: async () => {
      await delay()
      const sorted = [...feedState].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const items = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
      return {
        items: items.map((item) => ({
          ...item,
          actor: getPlayer(item.actor_id),
          secondary_actor: item.secondary_actor_id ? getPlayer(item.secondary_actor_id) : undefined,
        })),
        hasMore: sorted.length > (page + 1) * PAGE_SIZE,
        total: sorted.length,
      }
    },
  })
}

export function useAddFeedItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (item: Omit<ActivityFeedItem, 'id' | 'created_at'>) => {
      await delay(100)
      const newItem: ActivityFeedItem = {
        ...item,
        id: `af${Date.now()}`,
        created_at: new Date().toISOString(),
      }
      feedState = [newItem, ...feedState]
      return newItem
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity-feed'] }),
  })
}

// ─── Notifications ─────────────────────────────────────────────────────────────

let notificationsState = [...NOTIFICATIONS]

export function useNotifications(playerId: string) {
  return useQuery({
    queryKey: ['notifications', playerId],
    queryFn: async () => {
      await delay()
      return notificationsState
        .filter((n) => n.recipient_id === playerId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    },
  })
}

export function useUnreadCount(playerId: string) {
  return useQuery({
    queryKey: ['unread-count', playerId],
    queryFn: async () => {
      await delay(50)
      return notificationsState.filter((n) => n.recipient_id === playerId && !n.is_read).length
    },
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await delay(100)
      notificationsState = notificationsState.map((n) =>
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    },
    onSuccess: (_d, _v, ctx) => {
      const playerId = (ctx as { playerId?: string })?.playerId
      qc.invalidateQueries({ queryKey: ['notifications'] })
      if (playerId) qc.invalidateQueries({ queryKey: ['unread-count', playerId] })
    },
  })
}

// ─── Tour ──────────────────────────────────────────────────────────────────────

export function useTourEvent() {
  return useQuery({
    queryKey: ['tour-event'],
    queryFn: async () => {
      await delay()
      return TOUR_EVENT
    },
  })
}

export function useTourPlayers() {
  return useQuery({
    queryKey: ['tour-players'],
    queryFn: async () => {
      await delay()
      return TOUR_PLAYERS.map((tp) => ({
        ...tp,
        profile: getPlayer(tp.player_id),
      }))
    },
  })
}

export function useTourDays() {
  return useQuery({
    queryKey: ['tour-days'],
    queryFn: async () => {
      await delay()
      return TOUR_DAYS.map((d) => ({
        ...d,
        format: TOUR_FORMATS.find((f) => f.id === d.format_id)!,
        course: TOUR_COURSE,
      }))
    },
  })
}

export function useTourDayMatches(dayId: string) {
  return useQuery({
    queryKey: ['tour-day-matches', dayId],
    queryFn: async () => {
      await delay()
      const matches = TOUR_MATCHES.filter((m) => m.tour_day_id === dayId)
      return matches.map((match) => {
        const matchPlayers = TOUR_MATCH_PLAYERS.filter((mp) => mp.match_id === match.id)
        const playersA = matchPlayers
          .filter((mp) => mp.team === match.team_a)
          .map((mp) => ({
            ...TOUR_PLAYERS.find((tp) => tp.id === mp.tour_player_id)!,
            profile: getPlayer(TOUR_PLAYERS.find((tp) => tp.id === mp.tour_player_id)!.player_id),
            pair_index: mp.pair_index,
          }))
        const playersB = matchPlayers
          .filter((mp) => mp.team === match.team_b)
          .map((mp) => ({
            ...TOUR_PLAYERS.find((tp) => tp.id === mp.tour_player_id)!,
            profile: getPlayer(TOUR_PLAYERS.find((tp) => tp.id === mp.tour_player_id)!.player_id),
            pair_index: mp.pair_index,
          }))
        const day = TOUR_DAYS.find((d) => d.id === match.tour_day_id)!
        const format = TOUR_FORMATS.find((f) => f.id === day.format_id)!
        return { ...match, players_a: playersA, players_b: playersB, day, format }
      })
    },
  })
}

let tourHoleScoresState: TourHoleScore[] = []

export function useTourHoleScores(matchId: string) {
  return useQuery({
    queryKey: ['tour-hole-scores', matchId],
    queryFn: async () => {
      await delay()
      return tourHoleScoresState.filter((s) => s.match_id === matchId)
    },
  })
}

export function useSaveTourHoleScore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (score: Omit<TourHoleScore, 'id' | 'created_at'>) => {
      await delay(200)
      const existing = tourHoleScoresState.findIndex(
        (s) => s.match_id === score.match_id && s.tour_player_id === score.tour_player_id && s.hole_number === score.hole_number
      )
      const newScore: TourHoleScore = {
        ...score,
        id: `ths${Date.now()}`,
        created_at: new Date().toISOString(),
      }
      if (existing >= 0) {
        tourHoleScoresState = tourHoleScoresState.map((s, i) => i === existing ? newScore : s)
      } else {
        tourHoleScoresState = [...tourHoleScoresState, newScore]
      }
      return newScore
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['tour-hole-scores', vars.match_id] }),
  })
}

export function useTourLeaderboard() {
  return useQuery({
    queryKey: ['tour-leaderboard'],
    queryFn: async () => {
      await delay()
      const day1Score = { '93s': 0, '91s': 0 }
      const day2Score = { '93s': 0, '91s': 0 }

      TOUR_MATCHES.filter((m) => m.status === 'complete' && m.tour_day_id === 'td1').forEach((m) => {
        if (m.team_a === '93s') {
          day1Score['93s'] += m.team_a_points
          day1Score['91s'] += m.team_b_points
        } else {
          day1Score['91s'] += m.team_a_points
          day1Score['93s'] += m.team_b_points
        }
      })

      TOUR_MATCHES.filter((m) => m.status === 'complete' && m.tour_day_id === 'td2').forEach((m) => {
        if (m.team_a === '93s') {
          day2Score['93s'] += m.team_a_points
          day2Score['91s'] += m.team_b_points
        } else {
          day2Score['91s'] += m.team_a_points
          day2Score['93s'] += m.team_b_points
        }
      })

      return {
        '93s': { day1: day1Score['93s'], day2: day2Score['93s'], total: day1Score['93s'] + day2Score['93s'] },
        '91s': { day1: day1Score['91s'], day2: day2Score['91s'], total: day1Score['91s'] + day2Score['91s'] },
        target: TOUR_EVENT.target_points,
      }
    },
  })
}

export function useTourGreenJacket() {
  return useQuery({
    queryKey: ['tour-green-jacket'],
    queryFn: async () => {
      await delay()
      return TOUR_PLAYERS.map((tp) => {
        const profile = getPlayer(tp.player_id)
        const day1Points = TOUR_MATCHES.filter(
          (m) => m.tour_day_id === 'td1' && m.status === 'complete'
        ).reduce((sum, m) => {
          const mp = TOUR_MATCH_PLAYERS.find((p) => p.match_id === m.id && p.tour_player_id === tp.id)
          if (!mp) return sum
          return sum + (mp.team === m.team_a ? m.team_a_points : m.team_b_points)
        }, 0)

        return {
          tour_player: tp,
          profile,
          day_points: [
            { day: 1, points: day1Points },
            { day: 2, points: 0 },
            { day: 3, points: 0 },
          ],
          total_points: day1Points,
        }
      }).sort((a, b) => b.total_points - a.total_points)
        .map((entry, i) => ({ ...entry, rank: i + 1 }))
    },
  })
}

export function useTourHoles() {
  return useQuery({
    queryKey: ['tour-holes'],
    queryFn: async () => {
      await delay(50)
      return TOUR_HOLES
    },
  })
}

export function useTourChumps() {
  return useQuery({
    queryKey: ['tour-chumps'],
    queryFn: async () => {
      await delay()
      return TOUR_CHUMPS_PICKS.map((pick) => {
        const picker = getPlayer(pick.picker_id)
        const picks = [pick.pick_1_id, pick.pick_2_id, pick.pick_3_id, pick.pick_4_id].map(
          (tpId) => ({
            ...TOUR_PLAYERS.find((tp) => tp.id === tpId)!,
            profile: getPlayer(TOUR_PLAYERS.find((tp) => tp.id === tpId)!.player_id),
          })
        )
        const captain = {
          ...TOUR_PLAYERS.find((tp) => tp.id === pick.captain_id)!,
          profile: getPlayer(TOUR_PLAYERS.find((tp) => tp.id === pick.captain_id)!.player_id),
        }
        return { pick, picker, picks, captain, total_points: 0, rank: 0 }
      }).map((entry, i) => ({ ...entry, rank: i + 1 }))
    },
  })
}

// ─── Matchplay mutation ────────────────────────────────────────────────────────

let matchplayState = [...MATCHPLAY_RESULTS]

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
      await delay(500)
      const newResult = {
        ...data,
        id: `mr${Date.now()}`,
        season_id: 's1',
        created_at: new Date().toISOString(),
      }
      matchplayState = [...matchplayState, newResult]

      feedState = [
        {
          id: `af${Date.now()}`,
          season_id: 's1',
          type: 'matchplay' as const,
          actor_id: data.player_a_id,
          secondary_actor_id: data.player_b_id,
          description: `${getPlayer(data.player_a_id).display_name} vs ${getPlayer(data.player_b_id).display_name} at ${data.course_name}`,
          metadata: { result: data.result, margin: data.margin, course: data.course_name },
          created_at: new Date().toISOString(),
        },
        ...feedState,
      ]
      return newResult
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matchplay-results'] })
      qc.invalidateQueries({ queryKey: ['all-group-standings'] })
      qc.invalidateQueries({ queryKey: ['group-standings'] })
      qc.invalidateQueries({ queryKey: ['activity-feed'] })
    },
  })
}

const strokeplayStateRef = { value: [...STROKEPLAY_ROUNDS] }

export function useSubmitStrokeplay() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      player_id: string
      sub_season_id: string
      course_name: string
      played_at: string
      handicap_used: number
      gross_score: number
    }) => {
      await delay(500)
      const net_score = data.gross_score - data.handicap_used
      const newRound = {
        ...data,
        id: `sr${Date.now()}`,
        net_score,
        counts_for_ranking: true,
        created_at: new Date().toISOString(),
      }
      strokeplayStateRef.value = [...strokeplayStateRef.value, newRound]

      feedState = [
        {
          id: `af${Date.now()}`,
          season_id: 's1',
          type: 'strokeplay' as const,
          actor_id: data.player_id,
          description: `${getPlayer(data.player_id).display_name} shot a net ${net_score} at ${data.course_name}`,
          metadata: { net_score, course: data.course_name },
          created_at: new Date().toISOString(),
        },
        ...feedState,
      ]
      return newRound
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player-rounds'] })
      qc.invalidateQueries({ queryKey: ['bonus-league'] })
      qc.invalidateQueries({ queryKey: ['activity-feed'] })
    },
  })
}
