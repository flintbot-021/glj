// ─── Core Types (matching Supabase schema) ────────────────────────────────────

export interface Profile {
  id: string
  /** Auth login handle (stable key for seeds / admin). */
  display_name: string
  /** Legal / display name shown in the app when set. */
  full_name?: string
  initials: string
  email: string
  /** Public URL for profile photo. If unset, UI uses a generated avatar from `display_name`. */
  avatar_url?: string | null
  is_admin: boolean
  wallet_balance: number
  created_at: string
}

export interface Season {
  id: string
  name: string
  year: number
  win_points: number
  draw_points: number
  loss_points: number
  is_active: boolean
  start_date?: string
  end_date?: string
  created_at: string
}

export interface Group {
  id: string
  season_id: string
  name: string
  created_at: string
}

export interface GroupMembership {
  id: string
  group_id: string
  player_id: string
  created_at: string
}

export interface GroupStanding {
  player: Profile
  group_id: string
  wins: number
  losses: number
  draws: number
  played: number
  points: number
  bonus_points: number
  total_points: number
  /** Set when computed via `computeGroupStandings` ordering. */
  position?: number
}

// ─── Matchplay ─────────────────────────────────────────────────────────────────

export type MatchplayResultType = 'win_a' | 'win_b' | 'draw'

export interface MatchplayResult {
  id: string
  season_id: string
  group_id: string
  player_a_id: string
  player_b_id: string
  result: MatchplayResultType
  margin: string
  course_name: string
  played_at: string
  created_at: string
}

// ─── Bonus / Strokeplay ────────────────────────────────────────────────────────

export type SubSeasonStatus = 'open' | 'closed'

export interface SubSeason {
  id: string
  season_id: string
  name: string
  start_date: string
  end_date: string
  status: SubSeasonStatus
  bonus_1st: number
  bonus_2nd: number
  bonus_3rd: number
  closed_at?: string
  created_at: string
}

export interface StrokeplayRound {
  id: string
  player_id: string
  sub_season_id: string
  course_name: string
  played_at: string
  /** Course handicap for this round only (bonus strokeplay). */
  course_handicap: number
  gross_score: number
  net_score: number
  /** Players present at this round (includes scorer; min length 1). */
  present_player_ids: string[]
  counts_for_ranking: boolean
  created_at: string
}

export interface BonusPointAward {
  id: string
  sub_season_id: string
  player_id: string
  position: 1 | 2 | 3
  points_awarded: number
  created_at: string
}

// ─── Knockout ──────────────────────────────────────────────────────────────────

export type KnockoutRound = 'qf' | 'sf' | 'final'

export interface KnockoutFixture {
  id: string
  season_id: string
  round: KnockoutRound
  /** 1–4 for QF, 1–2 for SF, 1 for Final */
  slot_index: number
  player_a_id?: string
  player_b_id?: string
  result?: 'win_a' | 'win_b'
  margin?: string
  course_name?: string
  played_at?: string
  created_at: string
}

// ─── Wagers ────────────────────────────────────────────────────────────────────

export type WagerStatus =
  | 'pending_acceptance'
  | 'active'
  | 'pending_confirmation'
  | 'settled'
  | 'disputed'

export interface Wager {
  id: string
  proposer_id: string
  opponent_id: string
  amount: number
  status: WagerStatus
  result_winner_id?: string
  result_margin?: string
  result_course?: string
  result_played_at?: string
  proposer_confirmed: boolean
  opponent_confirmed: boolean
  settled_at?: string
  created_at: string
}

export type WalletTransactionType = 'wager_win' | 'wager_loss' | 'admin_credit' | 'admin_debit'

export interface WalletTransaction {
  id: string
  player_id: string
  amount: number
  type: WalletTransactionType
  reference_id?: string
  note?: string
  created_at: string
}

// ─── Feed & Notifications ──────────────────────────────────────────────────────

export type FeedItemType =
  | 'matchplay'
  | 'strokeplay'
  | 'wager'
  | 'bonus_points'
  | 'knockout'
  | 'tour_score'

export interface ActivityFeedItem {
  id: string
  season_id: string
  type: FeedItemType
  actor_id: string
  secondary_actor_id?: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

export type NotificationType =
  | 'wager_request'
  | 'wager_accepted'
  | 'wager_declined'
  | 'wager_result'
  | 'wager_confirmed'
  | 'wager_disputed'
  | 'matchplay_result'
  | 'sub_season_closed'
  | 'bracket_set'
  | 'tour_update'

export interface AppNotification {
  id: string
  recipient_id: string
  type: NotificationType
  reference_id: string
  message: string
  is_read: boolean
  created_at: string
}

// ─── Tour ──────────────────────────────────────────────────────────────────────

export type TourStatus = 'setup' | 'active' | 'complete'
export type TourTeam = '93s' | '91s'
export type TourDayStatus = 'setup' | 'locked' | 'in_progress' | 'complete'
export type TourMatchStatus = 'scheduled' | 'in_progress' | 'complete'

export interface TourEvent {
  id: string
  name: string
  status: TourStatus
  target_points: number
  created_at: string
}

export interface TourPlayer {
  id: string
  tour_id: string
  player_id: string
  team: TourTeam
  locked_handicap: number
  seed: number
  created_at: string
}

export interface TourCourse {
  id: string
  tour_id: string
  name: string
  created_at: string
}

export interface TourHole {
  id: string
  course_id: string
  hole_number: number
  par: number
  stroke_index: number
  /** Optional yardage shown in admin / yardage book */
  yardage?: number | null
  created_at: string
}

export interface TourFormat {
  id: string
  name: string
  description: string
  scoring_rules: Record<string, unknown>
  created_at: string
}

export interface TourDay {
  id: string
  tour_id: string
  day_number: number
  course_id: string
  format_id: string
  status: TourDayStatus
  played_at?: string
  created_at: string
}

export interface TourMatch {
  id: string
  tour_day_id: string
  team_a: TourTeam
  team_b: TourTeam
  status: TourMatchStatus
  team_a_points: number
  team_b_points: number
  created_at: string
}

export interface TourMatchPlayer {
  id: string
  match_id: string
  tour_player_id: string
  team: TourTeam
  pair_index: 0 | 1
}

export interface TourHoleScore {
  id: string
  match_id: string
  tour_player_id: string
  hole_number: number
  gross_score: number
  net_score: number
  stableford_points: number
  created_at: string
}

export interface TourChumpsPick {
  id: string
  tour_id: string
  picker_id: string
  pick_1_id: string
  pick_2_id: string
  pick_3_id: string
  pick_4_id: string
  captain_id: string
  captain_day: 1 | 2 | 3
  locked_at?: string
  created_at: string
}

/** Course / playing handicap for one player on one tour day (see `tour_players.locked_handicap` for tour-wide default). */
export interface TourPlayerDayHandicap {
  id: string
  tour_day_id: string
  tour_player_id: string
  course_handicap: number
  created_at: string
}

// ─── Enriched / Computed Types ─────────────────────────────────────────────────

export interface EnrichedWager extends Wager {
  proposer: Profile
  opponent: Profile
  result_winner?: Profile
}

export interface EnrichedFeedItem extends ActivityFeedItem {
  actor: Profile
  secondary_actor?: Profile
}

export interface EnrichedMatchplayResult extends MatchplayResult {
  player_a: Profile
  player_b: Profile
}

export interface GroupWithStandings {
  group: Group
  standings: GroupStanding[]
  fixtures: EnrichedMatchplayResult[]
}

export interface BonusLeagueEntry {
  player: Profile
  /** Rounds counted for R1/R2 (active bonus leg only). */
  rounds: StrokeplayRound[]
  r1_gross?: number
  r1_net?: number
  r2_gross?: number
  r2_net?: number
  /** Sum of counting net scores (one or two rounds in the leg). */
  total_net?: number
  /** Sum of `bonus_point_awards.points_awarded` this season (all legs). */
  bonus_points: number
  rank: number
}

export interface TourTeamScore {
  team: TourTeam
  total_points: number
  day_scores: { day: number; points: number }[]
}

export interface EnrichedTourMatch extends TourMatch {
  players_a: (TourPlayer & { profile: Profile })[]
  players_b: (TourPlayer & { profile: Profile })[]
  day: TourDay
  format: TourFormat
  hole_scores: TourHoleScore[]
}

export interface TourGreenJacketEntry {
  tour_player: TourPlayer
  profile: Profile
  day_points: { day: number; points: number }[]
  total_points: number
  rank: number
}

export interface TourChumpsEntry {
  pick: TourChumpsPick
  picker: Profile
  picks: (TourPlayer & { profile: Profile })[]
  captain: TourPlayer & { profile: Profile }
  total_points: number
  rank: number
}

// ─── Form Types ────────────────────────────────────────────────────────────────

export interface MatchplayFormData {
  opponent_id: string
  result: 'won' | 'lost' | 'drew'
  margin?: string
  course_name: string
  played_at: string
}

export interface StrokeplayFormData {
  course_name: string
  played_at: string
  course_handicap: number
  gross_score: number
  sub_season_id: string
}

export interface WagerFormData {
  opponent_id: string
  amount: number
}

export interface WagerResultData {
  wager_id: string
  winner_id: string
  margin: string
  course_name: string
  played_at: string
}
