import type {
  Profile,
  Season,
  Group,
  GroupMembership,
  MatchplayResult,
  SubSeason,
  StrokeplayRound,
  BonusPointAward,
  KnockoutFixture,
  Wager,
  WalletTransaction,
  ActivityFeedItem,
  AppNotification,
  TourEvent,
  TourPlayer,
  TourCourse,
  TourHole,
  TourFormat,
  TourDay,
  TourMatch,
  TourMatchPlayer,
  TourChumpsPick,
  TourHoleScore,
  TourPlayerDayHandicap,
} from '@/lib/types'

function num(v: unknown): number {
  if (v === null || v === undefined) return 0
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isNaN(n) ? 0 : n
  }
  return 0
}

export function mapProfile(r: Record<string, unknown>): Profile {
  return {
    id: String(r.id),
    display_name: String(r.display_name),
    full_name: r.full_name != null ? String(r.full_name) : undefined,
    initials: String(r.initials),
    email: String(r.email),
    avatar_url: r.avatar_url != null ? String(r.avatar_url) : null,
    is_admin: Boolean(r.is_admin),
    wallet_balance: num(r.wallet_balance),
    created_at: String(r.created_at),
  }
}

export function mapSeason(r: Record<string, unknown>): Season {
  return {
    id: String(r.id),
    name: String(r.name),
    year: num(r.year),
    win_points: num(r.win_points),
    draw_points: num(r.draw_points),
    loss_points: num(r.loss_points),
    is_active: Boolean(r.is_active),
    start_date: r.start_date != null ? String(r.start_date).slice(0, 10) : undefined,
    end_date: r.end_date != null ? String(r.end_date).slice(0, 10) : undefined,
    created_at: String(r.created_at),
  }
}

export function mapGroup(r: Record<string, unknown>): Group {
  return {
    id: String(r.id),
    season_id: String(r.season_id),
    name: String(r.name),
    created_at: String(r.created_at),
  }
}

export function mapGroupMembership(r: Record<string, unknown>): GroupMembership {
  return {
    id: String(r.id),
    group_id: String(r.group_id),
    player_id: String(r.player_id),
    created_at: String(r.created_at),
  }
}

export function mapMatchplayResult(r: Record<string, unknown>): MatchplayResult {
  return {
    id: String(r.id),
    season_id: String(r.season_id),
    group_id: String(r.group_id),
    player_a_id: String(r.player_a_id),
    player_b_id: String(r.player_b_id),
    result: r.result as MatchplayResult['result'],
    margin: String(r.margin),
    course_name: String(r.course_name),
    played_at: String(r.played_at),
    created_at: String(r.created_at),
  }
}

export function mapSubSeason(r: Record<string, unknown>): SubSeason {
  return {
    id: String(r.id),
    season_id: String(r.season_id),
    name: String(r.name),
    start_date: String(r.start_date),
    end_date: String(r.end_date),
    status: r.status as SubSeason['status'],
    bonus_1st: num(r.bonus_1st),
    bonus_2nd: num(r.bonus_2nd),
    bonus_3rd: num(r.bonus_3rd),
    closed_at: r.closed_at != null ? String(r.closed_at) : undefined,
    created_at: String(r.created_at),
  }
}

export function mapStrokeplayRound(r: Record<string, unknown>): StrokeplayRound {
  const present = r.present_player_ids
  const present_player_ids = Array.isArray(present)
    ? present.map((id) => String(id))
    : []
  return {
    id: String(r.id),
    player_id: String(r.player_id),
    sub_season_id: String(r.sub_season_id),
    course_name: String(r.course_name),
    played_at: String(r.played_at),
    course_handicap: num(r.course_handicap),
    gross_score: num(r.gross_score),
    net_score: num(r.net_score),
    present_player_ids,
    counts_for_ranking: Boolean(r.counts_for_ranking),
    created_at: String(r.created_at),
  }
}

export function mapBonusAward(r: Record<string, unknown>): BonusPointAward {
  return {
    id: String(r.id),
    sub_season_id: String(r.sub_season_id),
    player_id: String(r.player_id),
    position: num(r.position) as BonusPointAward['position'],
    points_awarded: num(r.points_awarded),
    created_at: String(r.created_at),
  }
}

export function mapKnockoutFixture(r: Record<string, unknown>): KnockoutFixture {
  const slot = r.slot_index != null ? num(r.slot_index as string | number) : 1
  return {
    id: String(r.id),
    season_id: String(r.season_id),
    round: r.round as KnockoutFixture['round'],
    slot_index: Number.isFinite(slot) && slot >= 1 ? slot : 1,
    player_a_id: r.player_a_id != null ? String(r.player_a_id) : undefined,
    player_b_id: r.player_b_id != null ? String(r.player_b_id) : undefined,
    result: r.result != null ? (r.result as KnockoutFixture['result']) : undefined,
    margin: r.margin != null ? String(r.margin) : undefined,
    course_name: r.course_name != null ? String(r.course_name) : undefined,
    played_at: r.played_at != null ? String(r.played_at) : undefined,
    created_at: String(r.created_at),
  }
}

export function mapWager(r: Record<string, unknown>): Wager {
  return {
    id: String(r.id),
    proposer_id: String(r.proposer_id),
    opponent_id: String(r.opponent_id),
    amount: num(r.amount),
    status: r.status as Wager['status'],
    result_winner_id: r.result_winner_id != null ? String(r.result_winner_id) : undefined,
    result_margin: r.result_margin != null ? String(r.result_margin) : undefined,
    result_course: r.result_course != null ? String(r.result_course) : undefined,
    result_played_at: r.result_played_at != null ? String(r.result_played_at) : undefined,
    proposer_confirmed: Boolean(r.proposer_confirmed),
    opponent_confirmed: Boolean(r.opponent_confirmed),
    settled_at: r.settled_at != null ? String(r.settled_at) : undefined,
    created_at: String(r.created_at),
  }
}

export function mapWalletTx(r: Record<string, unknown>): WalletTransaction {
  return {
    id: String(r.id),
    player_id: String(r.player_id),
    amount: num(r.amount),
    type: r.type as WalletTransaction['type'],
    reference_id: r.reference_id != null ? String(r.reference_id) : undefined,
    note: r.note != null ? String(r.note) : undefined,
    created_at: String(r.created_at),
  }
}

export function mapFeedItem(r: Record<string, unknown>): ActivityFeedItem {
  return {
    id: String(r.id),
    season_id: String(r.season_id),
    type: r.type as ActivityFeedItem['type'],
    actor_id: String(r.actor_id),
    secondary_actor_id: r.secondary_actor_id != null ? String(r.secondary_actor_id) : undefined,
    description: String(r.description),
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    created_at: String(r.created_at),
  }
}

export function mapNotification(r: Record<string, unknown>): AppNotification {
  return {
    id: String(r.id),
    recipient_id: String(r.recipient_id),
    type: r.type as AppNotification['type'],
    reference_id: String(r.reference_id),
    message: String(r.message),
    is_read: Boolean(r.is_read),
    created_at: String(r.created_at),
  }
}

export function mapTourEvent(r: Record<string, unknown>): TourEvent {
  return {
    id: String(r.id),
    name: String(r.name),
    status: r.status as TourEvent['status'],
    target_points: num(r.target_points),
    created_at: String(r.created_at),
  }
}

export function mapTourPlayer(r: Record<string, unknown>): TourPlayer {
  return {
    id: String(r.id),
    tour_id: String(r.tour_id),
    player_id: String(r.player_id),
    team: r.team as TourPlayer['team'],
    locked_handicap: num(r.locked_handicap),
    seed: num(r.seed),
    created_at: String(r.created_at),
  }
}

export function mapTourCourse(r: Record<string, unknown>): TourCourse {
  return {
    id: String(r.id),
    tour_id: String(r.tour_id),
    name: String(r.name),
    created_at: String(r.created_at),
  }
}

export function mapTourHole(r: Record<string, unknown>): TourHole {
  const y = r.yardage
  return {
    id: String(r.id),
    course_id: String(r.course_id),
    hole_number: num(r.hole_number),
    par: num(r.par),
    stroke_index: num(r.stroke_index),
    yardage: y === null || y === undefined ? null : num(y),
    created_at: String(r.created_at),
  }
}

export function mapTourFormat(r: Record<string, unknown>): TourFormat {
  return {
    id: String(r.id),
    name: String(r.name),
    description: r.description != null ? String(r.description) : '',
    scoring_rules: (r.scoring_rules as Record<string, unknown>) ?? {},
    created_at: String(r.created_at),
  }
}

export function mapTourDay(r: Record<string, unknown>): TourDay {
  return {
    id: String(r.id),
    tour_id: String(r.tour_id),
    day_number: num(r.day_number) as TourDay['day_number'],
    course_id: String(r.course_id),
    format_id: String(r.format_id),
    status: r.status as TourDay['status'],
    played_at: r.played_at != null ? String(r.played_at) : undefined,
    created_at: String(r.created_at),
  }
}

export function mapTourMatch(r: Record<string, unknown>): TourMatch {
  return {
    id: String(r.id),
    tour_day_id: String(r.tour_day_id),
    team_a: r.team_a as TourMatch['team_a'],
    team_b: r.team_b as TourMatch['team_b'],
    status: r.status as TourMatch['status'],
    team_a_points: num(r.team_a_points),
    team_b_points: num(r.team_b_points),
    created_at: String(r.created_at),
  }
}

export function mapTourMatchPlayer(r: Record<string, unknown>): TourMatchPlayer {
  return {
    id: String(r.id),
    match_id: String(r.match_id),
    tour_player_id: String(r.tour_player_id),
    team: r.team as TourMatchPlayer['team'],
    pair_index: num(r.pair_index) as TourMatchPlayer['pair_index'],
  }
}

export function mapTourHoleScore(r: Record<string, unknown>): TourHoleScore {
  return {
    id: String(r.id),
    match_id: String(r.match_id),
    tour_player_id: String(r.tour_player_id),
    hole_number: num(r.hole_number),
    gross_score: num(r.gross_score),
    net_score: num(r.net_score),
    stableford_points: num(r.stableford_points),
    created_at: String(r.created_at),
  }
}

export function mapTourPlayerDayHandicap(r: Record<string, unknown>): TourPlayerDayHandicap {
  return {
    id: String(r.id),
    tour_day_id: String(r.tour_day_id),
    tour_player_id: String(r.tour_player_id),
    course_handicap: num(r.course_handicap),
    created_at: String(r.created_at),
  }
}

export function mapTourChumpsPick(r: Record<string, unknown>): TourChumpsPick {
  return {
    id: String(r.id),
    tour_id: String(r.tour_id),
    picker_id: String(r.picker_id),
    pick_1_id: String(r.pick_1_id),
    pick_2_id: String(r.pick_2_id),
    pick_3_id: String(r.pick_3_id),
    pick_4_id: String(r.pick_4_id),
    captain_id: String(r.captain_id),
    captain_day: num(r.captain_day) as TourChumpsPick['captain_day'],
    locked_at: r.locked_at != null ? String(r.locked_at) : undefined,
    created_at: String(r.created_at),
  }
}
