import {
  fetchProfileMap,
  fetchTourChumpsPicks,
  fetchTourCourses,
  fetchTourDays,
  fetchTourEvent,
  fetchTourFormats,
  fetchTourHoleScores,
  fetchTourHoleScoresForMatches,
  fetchTourHolesForCourse,
  fetchTourMatchById,
  fetchTourMatchPlayersForMatches,
  fetchTourMatchesForDays,
  fetchTourPlayerDayHandicapsForDays,
  fetchTourPlayers,
  fetchTourCourseById,
  fetchTourDayById,
  fetchTourFormatById,
  updateTourMatch,
  upsertTourHoleScore,
  deleteTourHoleScore,
} from '@/lib/supabase/api'
import {
  champsEntryPoints,
  computeMatchPlay,
  matchFormatFromTourFormat,
  playerStablefordTotal,
  type ComputedMatch,
} from '@/lib/tour-scoring'
import type {
  Profile,
  TourChumpsPick,
  TourCourse,
  TourDay,
  TourEvent,
  TourFormat,
  TourHole,
  TourHoleScore,
  TourMatch,
  TourPlayer,
  TourTeam,
} from '@/lib/types'

export type TourRosterPlayer = TourPlayer & { profile: Profile }

export type TourMatchPlayerView = TourRosterPlayer & {
  pair_index: 0 | 1
  course_handicap_day: number
}

export interface TourMatchView {
  match: TourMatch
  matchNumber: number
  dayNumber: number
  dayId: string
  format: TourFormat
  course: TourCourse | null
  playersA: TourMatchPlayerView[]
  playersB: TourMatchPlayerView[]
  scores: TourHoleScore[]
  computed: ComputedMatch
  holes: TourHole[]
}

export function matchIsPending(view: TourMatchView): boolean {
  return view.playersA.length === 0 && view.playersB.length === 0
}

export interface TourBoardDay {
  day: TourDay
  format: TourFormat
  course: TourCourse | null
  matches: TourMatchView[]
  points93: number
  points91: number
}

export interface TourGreenJacketRow {
  player: TourRosterPlayer
  dayPoints: [number, number, number]
  total: number
  rank: number
}

export interface TourChampsRow {
  pick: TourChumpsPick
  picker: Profile
  picks: TourRosterPlayer[]
  captain: TourRosterPlayer
  pickDayPoints: [number, number, number][]
  total: number
  rank: number
}

export interface TourBoard {
  event: TourEvent
  players: TourRosterPlayer[]
  days: TourBoardDay[]
  matches: TourMatchView[]
  points93: number
  points91: number
  greenJacket: TourGreenJacketRow[]
  champs: TourChampsRow[]
}

export async function loadTourBoard(): Promise<TourBoard | null> {
  const event = await fetchTourEvent()
  if (!event) return null

  const [rawPlayers, rawDays, formats, courses, picks] = await Promise.all([
    fetchTourPlayers(event.id),
    fetchTourDays(event.id),
    fetchTourFormats(),
    fetchTourCourses(event.id),
    fetchTourChumpsPicks(event.id),
  ])

  const dayIds = rawDays.map((d) => d.id)
  const matches = await fetchTourMatchesForDays(dayIds)
  const matchIds = matches.map((m) => m.id)

  const [mps, scores, dayHcs, profileMap] = await Promise.all([
    fetchTourMatchPlayersForMatches(matchIds),
    fetchTourHoleScoresForMatches(matchIds),
    fetchTourPlayerDayHandicapsForDays(dayIds),
    fetchProfileMap([
      ...rawPlayers.map((p) => p.player_id),
      ...picks.map((p) => p.picker_id),
    ]),
  ])

  const uniqueCourses = [...new Set(rawDays.map((d) => d.course_id).filter((id): id is string => !!id))]
  const holesEntries = await Promise.all(
    uniqueCourses.map(async (id) => [id, await fetchTourHolesForCourse(id)] as const),
  )
  const holesByCourse = new Map(holesEntries)

  const formatMap = new Map(formats.map((f) => [f.id, f]))
  const courseMap = new Map(courses.map((c) => [c.id, c]))
  const tpMap = new Map(rawPlayers.map((tp) => [tp.id, tp]))

  const players: TourRosterPlayer[] = rawPlayers.map((tp) => ({
    ...tp,
    profile: profileMap.get(tp.player_id)!,
  }))

  const hcKey = (dayId: string, tpId: string) => `${dayId}:${tpId}`
  const hcMap = new Map(dayHcs.map((h) => [hcKey(h.tour_day_id, h.tour_player_id), h.course_handicap]))

  const buildSide = (
    matchId: string,
    team: TourTeam,
    dayId: string,
  ): TourMatchPlayerView[] =>
    mps
      .filter((mp) => mp.match_id === matchId && mp.team === team)
      .sort((a, b) => a.pair_index - b.pair_index)
      .map((mp) => {
        const tp = tpMap.get(mp.tour_player_id)
        if (!tp) throw new Error('tour_player missing')
        return {
          ...tp,
          profile: profileMap.get(tp.player_id)!,
          pair_index: mp.pair_index,
          course_handicap_day: hcMap.get(hcKey(dayId, tp.id)) ?? tp.locked_handicap,
        }
      })

  const matchesByDay = new Map<string, TourMatch[]>()
  for (const m of matches) {
    const list = matchesByDay.get(m.tour_day_id) ?? []
    list.push(m)
    matchesByDay.set(m.tour_day_id, list)
  }

  const scoresByMatch = new Map<string, TourHoleScore[]>()
  for (const s of scores) {
    const list = scoresByMatch.get(s.match_id) ?? []
    list.push(s)
    scoresByMatch.set(s.match_id, list)
  }

  const dayViews: TourBoardDay[] = rawDays.map((day) => {
    const format = formatMap.get(day.format_id)!
    const course = day.course_id ? courseMap.get(day.course_id) ?? null : null
    const holes = day.course_id ? holesByCourse.get(day.course_id) ?? [] : []
    const dayMatches = matchesByDay.get(day.id) ?? []
    const views: TourMatchView[] = dayMatches.map((match, i) => {
      const playersA = buildSide(match.id, match.team_a, day.id)
      const playersB = buildSide(match.id, match.team_b, day.id)
      const matchScores = scoresByMatch.get(match.id) ?? []
      const computed = computeMatchPlay(
        matchScores,
        playersA.map((p) => p.id),
        playersB.map((p) => p.id),
        match.team_a,
        match.team_b,
        matchFormatFromTourFormat(format),
        holes,
      )
      return {
        match,
        matchNumber: i + 1,
        dayNumber: day.day_number,
        dayId: day.id,
        format,
        course,
        playersA,
        playersB,
        scores: matchScores,
        computed,
        holes,
      }
    })
    return {
      day,
      format,
      course,
      matches: views,
      points93: views.reduce((s, v) => s + v.computed.points93, 0),
      points91: views.reduce((s, v) => s + v.computed.points91, 0),
    }
  })

  const allMatches = dayViews.flatMap((d) => d.matches)

  const pointsByPlayerDay = new Map<string, number>()
  for (const view of allMatches) {
    for (const p of [...view.playersA, ...view.playersB]) {
      const key = `${p.id}:${view.dayNumber}`
      pointsByPlayerDay.set(
        key,
        (pointsByPlayerDay.get(key) ?? 0) + playerStablefordTotal(view.scores, p.id),
      )
    }
  }

  const greenJacket: TourGreenJacketRow[] = players
    .map((player) => {
      const dayPoints: [number, number, number] = [
        pointsByPlayerDay.get(`${player.id}:1`) ?? 0,
        pointsByPlayerDay.get(`${player.id}:2`) ?? 0,
        pointsByPlayerDay.get(`${player.id}:3`) ?? 0,
      ]
      return { player, dayPoints, total: dayPoints[0] + dayPoints[1] + dayPoints[2], rank: 0 }
    })
    .sort((a, b) => b.total - a.total || a.player.seed - b.player.seed)
    .map((row, i) => ({ ...row, rank: i + 1 }))

  const playerView = new Map(players.map((p) => [p.id, p]))
  const champs: TourChampsRow[] = picks
    .map((pick) => {
      const ids = [pick.pick_1_id, pick.pick_2_id, pick.pick_3_id, pick.pick_4_id]
      const pickPlayers = ids.map((id) => playerView.get(id)).filter(Boolean) as TourRosterPlayer[]
      const captain = playerView.get(pick.captain_id)
      const picker = profileMap.get(pick.picker_id)
      if (!captain || !picker || pickPlayers.length !== 4) return null
      return {
        pick,
        picker,
        picks: pickPlayers,
        captain,
        pickDayPoints: pickPlayers.map((p) => [
          pointsByPlayerDay.get(`${p.id}:1`) ?? 0,
          pointsByPlayerDay.get(`${p.id}:2`) ?? 0,
          pointsByPlayerDay.get(`${p.id}:3`) ?? 0,
        ]),
        total: champsEntryPoints(ids, pick.captain_id, pick.captain_day, pointsByPlayerDay),
        rank: 0,
      }
    })
    .filter((row): row is TourChampsRow => row != null)
    .sort((a, b) => b.total - a.total)
    .map((row, i) => ({ ...row, rank: i + 1 }))

  return {
    event,
    players,
    days: dayViews,
    matches: allMatches,
    points93: dayViews.reduce((s, d) => s + d.points93, 0),
    points91: dayViews.reduce((s, d) => s + d.points91, 0),
    greenJacket,
    champs,
  }
}

export async function loadTourMatchBundle(matchId: string): Promise<TourMatchView | null> {
  const match = await fetchTourMatchById(matchId)
  if (!match) return null
  const dayRow = await fetchTourDayById(match.tour_day_id)
  if (!dayRow) return null
  const [format, course, mps, scores, dayHcs] = await Promise.all([
    fetchTourFormatById(dayRow.format_id),
    dayRow.course_id ? fetchTourCourseById(dayRow.course_id) : Promise.resolve(null),
    fetchTourMatchPlayersForMatches([match.id]),
    fetchTourHoleScores(match.id),
    fetchTourPlayerDayHandicapsForDays([dayRow.id]),
  ])
  if (!format) return null
  const event = await fetchTourEvent()
  const tps = event ? await fetchTourPlayers(event.id) : []
  const profiles = await fetchProfileMap(tps.map((tp) => tp.player_id))
  const holes = course ? await fetchTourHolesForCourse(course.id) : []
  const hcMap = new Map(dayHcs.map((h) => [h.tour_player_id, h.course_handicap]))
  const tpMap = new Map(tps.map((tp) => [tp.id, tp]))

  const side = (team: TourTeam): TourMatchPlayerView[] =>
    mps
      .filter((mp) => mp.team === team)
      .sort((a, b) => a.pair_index - b.pair_index)
      .map((mp) => {
        const tp = tpMap.get(mp.tour_player_id)
        if (!tp) throw new Error('tour_player missing')
        return {
          ...tp,
          profile: profiles.get(tp.player_id)!,
          pair_index: mp.pair_index,
          course_handicap_day: hcMap.get(tp.id) ?? tp.locked_handicap,
        }
      })

  const playersA = side(match.team_a)
  const playersB = side(match.team_b)
  const computed = computeMatchPlay(
    scores,
    playersA.map((p) => p.id),
    playersB.map((p) => p.id),
    match.team_a,
    match.team_b,
    matchFormatFromTourFormat(format),
    holes,
  )

  const siblings = await fetchTourMatchesForDays([dayRow.id])
  const matchNumber = siblings.findIndex((m) => m.id === match.id) + 1

  return {
    match,
    matchNumber: matchNumber || 1,
    dayNumber: dayRow.day_number,
    dayId: dayRow.id,
    format,
    course,
    playersA,
    playersB,
    scores,
    computed,
    holes,
  }
}

export async function saveTourHolesAndRollup(
  rows: {
    match_id: string
    tour_player_id: string
    hole_number: number
    gross_score: number
    net_score: number
    stableford_points: number
  }[],
  ctx: {
    matchId: string
    playerIdsA: string[]
    playerIdsB: string[]
    teamA: TourTeam
    teamB: TourTeam
    spec: ReturnType<typeof matchFormatFromTourFormat>
    holes: { hole_number: number; par: number }[]
  },
) {
  await Promise.all(
    rows.map((row) =>
      row.gross_score < 1
        ? deleteTourHoleScore(row.match_id, row.tour_player_id, row.hole_number)
        : upsertTourHoleScore(row),
    ),
  )
  const scores = await fetchTourHoleScores(ctx.matchId)
  const computed = computeMatchPlay(
    scores,
    ctx.playerIdsA,
    ctx.playerIdsB,
    ctx.teamA,
    ctx.teamB,
    ctx.spec,
    ctx.holes,
  )
  const status = computed.closed ? 'complete' : computed.holesPlayed > 0 ? 'in_progress' : 'scheduled'
  await updateTourMatch(ctx.matchId, {
    status,
    team_a_points: computed.pointsA,
    team_b_points: computed.pointsB,
  })
  return computed
}
