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
} from './types'

// ─── Players (17 friends) ──────────────────────────────────────────────────────

export const PLAYERS: Profile[] = [
  { id: 'p1', display_name: 'Conor Murphy', initials: 'CM', email: 'conor@rtd.com', handicap: 12, is_admin: true, wallet_balance: 145.00, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p2', display_name: 'Jamie Walsh', initials: 'JW', email: 'jamie@rtd.com', handicap: 8, is_admin: false, wallet_balance: 230.50, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p3', display_name: 'Darragh Brennan', initials: 'DB', email: 'darragh@rtd.com', handicap: 15, is_admin: false, wallet_balance: 80.00, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p4', display_name: 'Sean O\'Brien', initials: 'SO', email: 'sean@rtd.com', handicap: 10, is_admin: false, wallet_balance: 310.00, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p5', display_name: 'Kieran Daly', initials: 'KD', email: 'kieran@rtd.com', handicap: 18, is_admin: false, wallet_balance: 55.00, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p6', display_name: 'Finn McCarthy', initials: 'FM', email: 'finn@rtd.com', handicap: 6, is_admin: false, wallet_balance: 420.00, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p7', display_name: 'Liam Ryan', initials: 'LR', email: 'liam@rtd.com', handicap: 14, is_admin: false, wallet_balance: 95.00, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p8', display_name: 'Eoin Gallagher', initials: 'EG', email: 'eoin@rtd.com', handicap: 9, is_admin: false, wallet_balance: 175.00, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p9', display_name: 'Rory Flanagan', initials: 'RF', email: 'rory@rtd.com', handicap: 11, is_admin: false, wallet_balance: 200.00, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p10', display_name: 'Colm Doyle', initials: 'CD', email: 'colm@rtd.com', handicap: 16, is_admin: false, wallet_balance: 120.00, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p11', display_name: 'Barry Nolan', initials: 'BN', email: 'barry@rtd.com', handicap: 7, is_admin: false, wallet_balance: 360.00, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p12', display_name: 'Mark Sheridan', initials: 'MS', email: 'mark@rtd.com', handicap: 13, is_admin: false, wallet_balance: 140.00, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p13', display_name: 'Pat Quinlan', initials: 'PQ', email: 'pat@rtd.com', handicap: 20, is_admin: false, wallet_balance: 45.00, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p14', display_name: 'Alan Keane', initials: 'AK', email: 'alan@rtd.com', handicap: 5, is_admin: false, wallet_balance: 510.00, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p15', display_name: 'Declan Byrne', initials: 'DB2', email: 'declan@rtd.com', handicap: 17, is_admin: false, wallet_balance: 70.00, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p16', display_name: 'Niall Coffey', initials: 'NC', email: 'niall@rtd.com', handicap: 3, is_admin: false, wallet_balance: 680.00, created_at: '2026-01-01T00:00:00Z' },
  { id: 'p17', display_name: 'Tom Higgins', initials: 'TH', email: 'tom@rtd.com', handicap: 22, is_admin: false, wallet_balance: 30.00, created_at: '2026-01-01T00:00:00Z' },
]

export const getPlayer = (id: string) => PLAYERS.find((p) => p.id === id)!

// ─── Season ────────────────────────────────────────────────────────────────────

export const ACTIVE_SEASON: Season = {
  id: 's1',
  name: 'RTD 2026',
  year: 2026,
  win_points: 3,
  draw_points: 1,
  loss_points: 0,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
}

// ─── Groups ────────────────────────────────────────────────────────────────────

export const GROUPS: Group[] = [
  { id: 'g1', season_id: 's1', name: 'Group A', created_at: '2026-01-01T00:00:00Z' },
  { id: 'g2', season_id: 's1', name: 'Group B', created_at: '2026-01-01T00:00:00Z' },
  { id: 'g3', season_id: 's1', name: 'Group C', created_at: '2026-01-01T00:00:00Z' },
  { id: 'g4', season_id: 's1', name: 'Group D', created_at: '2026-01-01T00:00:00Z' },
]

// Group A: p1, p2, p3, p4 (4 players)
// Group B: p5, p6, p7, p8 (4 players)
// Group C: p9, p10, p11, p12 (4 players)
// Group D: p13, p14, p15, p16, p17 (5 players)

export const GROUP_MEMBERSHIPS: GroupMembership[] = [
  // Group A
  { id: 'gm1', group_id: 'g1', player_id: 'p1', created_at: '2026-01-01T00:00:00Z' },
  { id: 'gm2', group_id: 'g1', player_id: 'p2', created_at: '2026-01-01T00:00:00Z' },
  { id: 'gm3', group_id: 'g1', player_id: 'p3', created_at: '2026-01-01T00:00:00Z' },
  { id: 'gm4', group_id: 'g1', player_id: 'p4', created_at: '2026-01-01T00:00:00Z' },
  // Group B
  { id: 'gm5', group_id: 'g2', player_id: 'p5', created_at: '2026-01-01T00:00:00Z' },
  { id: 'gm6', group_id: 'g2', player_id: 'p6', created_at: '2026-01-01T00:00:00Z' },
  { id: 'gm7', group_id: 'g2', player_id: 'p7', created_at: '2026-01-01T00:00:00Z' },
  { id: 'gm8', group_id: 'g2', player_id: 'p8', created_at: '2026-01-01T00:00:00Z' },
  // Group C
  { id: 'gm9', group_id: 'g3', player_id: 'p9', created_at: '2026-01-01T00:00:00Z' },
  { id: 'gm10', group_id: 'g3', player_id: 'p10', created_at: '2026-01-01T00:00:00Z' },
  { id: 'gm11', group_id: 'g3', player_id: 'p11', created_at: '2026-01-01T00:00:00Z' },
  { id: 'gm12', group_id: 'g3', player_id: 'p12', created_at: '2026-01-01T00:00:00Z' },
  // Group D
  { id: 'gm13', group_id: 'g4', player_id: 'p13', created_at: '2026-01-01T00:00:00Z' },
  { id: 'gm14', group_id: 'g4', player_id: 'p14', created_at: '2026-01-01T00:00:00Z' },
  { id: 'gm15', group_id: 'g4', player_id: 'p15', created_at: '2026-01-01T00:00:00Z' },
  { id: 'gm16', group_id: 'g4', player_id: 'p16', created_at: '2026-01-01T00:00:00Z' },
  { id: 'gm17', group_id: 'g4', player_id: 'p17', created_at: '2026-01-01T00:00:00Z' },
]

export function getGroupForPlayer(playerId: string): Group | undefined {
  const membership = GROUP_MEMBERSHIPS.find((m) => m.player_id === playerId)
  if (!membership) return undefined
  return GROUPS.find((g) => g.id === membership.group_id)
}

export function getPlayersInGroup(groupId: string): Profile[] {
  const memberIds = GROUP_MEMBERSHIPS.filter((m) => m.group_id === groupId).map((m) => m.player_id)
  return PLAYERS.filter((p) => memberIds.includes(p.id))
}

// ─── Matchplay Results ─────────────────────────────────────────────────────────

export const MATCHPLAY_RESULTS: MatchplayResult[] = [
  // Group A results
  { id: 'mr1', season_id: 's1', group_id: 'g1', player_a_id: 'p1', player_b_id: 'p2', result: 'win_a', margin: '3&2', course_name: 'Royal Dublin', played_at: '2026-02-10', created_at: '2026-02-10T14:00:00Z' },
  { id: 'mr2', season_id: 's1', group_id: 'g1', player_a_id: 'p1', player_b_id: 'p3', result: 'draw', margin: 'All Square', course_name: 'Portmarnock Links', played_at: '2026-02-22', created_at: '2026-02-22T14:00:00Z' },
  { id: 'mr3', season_id: 's1', group_id: 'g1', player_a_id: 'p2', player_b_id: 'p4', result: 'win_a', margin: '2&1', course_name: 'Royal Dublin', played_at: '2026-03-05', created_at: '2026-03-05T14:00:00Z' },
  { id: 'mr4', season_id: 's1', group_id: 'g1', player_a_id: 'p3', player_b_id: 'p4', result: 'win_b', margin: '4&3', course_name: 'Mount Juliet', played_at: '2026-03-12', created_at: '2026-03-12T14:00:00Z' },
  { id: 'mr5', season_id: 's1', group_id: 'g1', player_a_id: 'p2', player_b_id: 'p3', result: 'win_a', margin: '1 Up', course_name: 'European Club', played_at: '2026-03-20', created_at: '2026-03-20T14:00:00Z' },
  // Group B results
  { id: 'mr6', season_id: 's1', group_id: 'g2', player_a_id: 'p6', player_b_id: 'p5', result: 'win_a', margin: '5&4', course_name: 'Portmarnock Links', played_at: '2026-02-14', created_at: '2026-02-14T14:00:00Z' },
  { id: 'mr7', season_id: 's1', group_id: 'g2', player_a_id: 'p8', player_b_id: 'p7', result: 'win_a', margin: '2 Up', course_name: 'Druids Glen', played_at: '2026-02-28', created_at: '2026-02-28T14:00:00Z' },
  { id: 'mr8', season_id: 's1', group_id: 'g2', player_a_id: 'p6', player_b_id: 'p8', result: 'win_a', margin: '3&2', course_name: 'The K Club', played_at: '2026-03-08', created_at: '2026-03-08T14:00:00Z' },
  { id: 'mr9', season_id: 's1', group_id: 'g2', player_a_id: 'p5', player_b_id: 'p7', result: 'draw', margin: 'Halved', course_name: 'Portmarnock Links', played_at: '2026-03-15', created_at: '2026-03-15T14:00:00Z' },
  // Group C results
  { id: 'mr10', season_id: 's1', group_id: 'g3', player_a_id: 'p11', player_b_id: 'p9', result: 'win_a', margin: '4&2', course_name: 'European Club', played_at: '2026-02-12', created_at: '2026-02-12T14:00:00Z' },
  { id: 'mr11', season_id: 's1', group_id: 'g3', player_a_id: 'p11', player_b_id: 'p12', result: 'win_a', margin: '2&1', course_name: 'Royal Dublin', played_at: '2026-02-25', created_at: '2026-02-25T14:00:00Z' },
  { id: 'mr12', season_id: 's1', group_id: 'g3', player_a_id: 'p9', player_b_id: 'p10', result: 'draw', margin: 'All Square', course_name: 'Druids Glen', played_at: '2026-03-10', created_at: '2026-03-10T14:00:00Z' },
  { id: 'mr13', season_id: 's1', group_id: 'g3', player_a_id: 'p12', player_b_id: 'p10', result: 'win_b', margin: '1 Up', course_name: 'Mount Juliet', played_at: '2026-03-18', created_at: '2026-03-18T14:00:00Z' },
  // Group D results
  { id: 'mr14', season_id: 's1', group_id: 'g4', player_a_id: 'p16', player_b_id: 'p13', result: 'win_a', margin: '6&5', course_name: 'Portmarnock Links', played_at: '2026-02-16', created_at: '2026-02-16T14:00:00Z' },
  { id: 'mr15', season_id: 's1', group_id: 'g4', player_a_id: 'p14', player_b_id: 'p15', result: 'win_a', margin: '3&2', course_name: 'Royal Dublin', played_at: '2026-02-24', created_at: '2026-02-24T14:00:00Z' },
  { id: 'mr16', season_id: 's1', group_id: 'g4', player_a_id: 'p16', player_b_id: 'p14', result: 'draw', margin: 'Halved', course_name: 'The K Club', played_at: '2026-03-02', created_at: '2026-03-02T14:00:00Z' },
  { id: 'mr17', season_id: 's1', group_id: 'g4', player_a_id: 'p14', player_b_id: 'p17', result: 'win_a', margin: '7&6', course_name: 'European Club', played_at: '2026-03-14', created_at: '2026-03-14T14:00:00Z' },
  { id: 'mr18', season_id: 's1', group_id: 'g4', player_a_id: 'p13', player_b_id: 'p17', result: 'win_a', margin: '2 Up', course_name: 'Druids Glen', played_at: '2026-03-22', created_at: '2026-03-22T14:00:00Z' },
]

// ─── Sub Seasons ───────────────────────────────────────────────────────────────

export const SUB_SEASONS: SubSeason[] = [
  {
    id: 'ss1',
    season_id: 's1',
    name: 'Sub-Season 1',
    start_date: '2026-01-01',
    end_date: '2026-03-31',
    status: 'closed',
    bonus_1st: 1.5,
    bonus_2nd: 1.0,
    bonus_3rd: 0.5,
    closed_at: '2026-04-01T09:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ss2',
    season_id: 's1',
    name: 'Sub-Season 2',
    start_date: '2026-04-01',
    end_date: '2026-06-30',
    status: 'open',
    bonus_1st: 1.5,
    bonus_2nd: 1.0,
    bonus_3rd: 0.5,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ss3',
    season_id: 's1',
    name: 'Sub-Season 3',
    start_date: '2026-07-01',
    end_date: '2026-09-30',
    status: 'open',
    bonus_1st: 1.5,
    bonus_2nd: 1.0,
    bonus_3rd: 0.5,
    created_at: '2026-01-01T00:00:00Z',
  },
]

// ─── Strokeplay Rounds ─────────────────────────────────────────────────────────

export const STROKEPLAY_ROUNDS: StrokeplayRound[] = [
  // Sub-season 1 (closed)
  { id: 'sr1', player_id: 'p2', sub_season_id: 'ss1', course_name: 'Royal Dublin', played_at: '2026-01-20', handicap_used: 8, gross_score: 79, net_score: 71, counts_for_ranking: true, created_at: '2026-01-20T18:00:00Z' },
  { id: 'sr2', player_id: 'p2', sub_season_id: 'ss1', course_name: 'European Club', played_at: '2026-02-15', handicap_used: 8, gross_score: 82, net_score: 74, counts_for_ranking: true, created_at: '2026-02-15T18:00:00Z' },
  { id: 'sr3', player_id: 'p14', sub_season_id: 'ss1', course_name: 'Portmarnock Links', played_at: '2026-01-28', handicap_used: 5, gross_score: 76, net_score: 71, counts_for_ranking: true, created_at: '2026-01-28T18:00:00Z' },
  { id: 'sr4', player_id: 'p14', sub_season_id: 'ss1', course_name: 'The K Club', played_at: '2026-02-20', handicap_used: 5, gross_score: 77, net_score: 72, counts_for_ranking: true, created_at: '2026-02-20T18:00:00Z' },
  { id: 'sr5', player_id: 'p16', sub_season_id: 'ss1', course_name: 'Mount Juliet', played_at: '2026-02-03', handicap_used: 3, gross_score: 74, net_score: 71, counts_for_ranking: true, created_at: '2026-02-03T18:00:00Z' },
  { id: 'sr6', player_id: 'p16', sub_season_id: 'ss1', course_name: 'Royal Dublin', played_at: '2026-03-10', handicap_used: 3, gross_score: 75, net_score: 72, counts_for_ranking: true, created_at: '2026-03-10T18:00:00Z' },
  { id: 'sr7', player_id: 'p6', sub_season_id: 'ss1', course_name: 'The K Club', played_at: '2026-01-18', handicap_used: 6, gross_score: 78, net_score: 72, counts_for_ranking: true, created_at: '2026-01-18T18:00:00Z' },
  { id: 'sr8', player_id: 'p6', sub_season_id: 'ss1', course_name: 'Druids Glen', played_at: '2026-03-05', handicap_used: 6, gross_score: 80, net_score: 74, counts_for_ranking: true, created_at: '2026-03-05T18:00:00Z' },
  { id: 'sr9', player_id: 'p11', sub_season_id: 'ss1', course_name: 'Portmarnock Links', played_at: '2026-02-08', handicap_used: 7, gross_score: 79, net_score: 72, counts_for_ranking: true, created_at: '2026-02-08T18:00:00Z' },
  { id: 'sr10', player_id: 'p1', sub_season_id: 'ss1', course_name: 'European Club', played_at: '2026-01-25', handicap_used: 12, gross_score: 88, net_score: 76, counts_for_ranking: true, created_at: '2026-01-25T18:00:00Z' },
  // Sub-season 2 (open, in progress)
  { id: 'sr11', player_id: 'p2', sub_season_id: 'ss2', course_name: 'Ballybunion', played_at: '2026-04-02', handicap_used: 8, gross_score: 80, net_score: 72, counts_for_ranking: true, created_at: '2026-04-02T18:00:00Z' },
  { id: 'sr12', player_id: 'p4', sub_season_id: 'ss2', course_name: 'Royal Dublin', played_at: '2026-04-05', handicap_used: 10, gross_score: 85, net_score: 75, counts_for_ranking: true, created_at: '2026-04-05T18:00:00Z' },
  { id: 'sr13', player_id: 'p16', sub_season_id: 'ss2', course_name: 'Lahinch', played_at: '2026-04-04', handicap_used: 3, gross_score: 73, net_score: 70, counts_for_ranking: true, created_at: '2026-04-04T18:00:00Z' },
]

// ─── Bonus Point Awards (from closed sub-season 1) ─────────────────────────────

export const BONUS_POINT_AWARDS: BonusPointAward[] = [
  { id: 'bp1', sub_season_id: 'ss1', player_id: 'p2', position: 1, points_awarded: 1.5, created_at: '2026-04-01T09:00:00Z' },
  { id: 'bp2', sub_season_id: 'ss1', player_id: 'p14', position: 2, points_awarded: 1.0, created_at: '2026-04-01T09:00:00Z' },
  { id: 'bp3', sub_season_id: 'ss1', player_id: 'p16', position: 3, points_awarded: 0.5, created_at: '2026-04-01T09:00:00Z' },
]

// ─── Knockout Bracket ──────────────────────────────────────────────────────────

export const KNOCKOUT_FIXTURES: KnockoutFixture[] = [
  // Quarter finals
  { id: 'kf1', season_id: 's1', round: 'qf', player_a_id: 'p2', player_b_id: 'p11', result: 'win_a', margin: '2&1', course_name: 'Royal Dublin', played_at: '2026-04-12', created_at: '2026-04-01T00:00:00Z' },
  { id: 'kf2', season_id: 's1', round: 'qf', player_a_id: 'p6', player_b_id: 'p16', result: undefined, margin: undefined, course_name: undefined, played_at: undefined, created_at: '2026-04-01T00:00:00Z' },
  { id: 'kf3', season_id: 's1', round: 'qf', player_a_id: 'p1', player_b_id: 'p14', result: undefined, margin: undefined, course_name: undefined, played_at: undefined, created_at: '2026-04-01T00:00:00Z' },
  { id: 'kf4', season_id: 's1', round: 'qf', player_a_id: 'p8', player_b_id: 'p9', result: undefined, margin: undefined, course_name: undefined, played_at: undefined, created_at: '2026-04-01T00:00:00Z' },
  // Semi finals (TBD)
  { id: 'kf5', season_id: 's1', round: 'sf', player_a_id: undefined, player_b_id: undefined, result: undefined, created_at: '2026-04-01T00:00:00Z' },
  { id: 'kf6', season_id: 's1', round: 'sf', player_a_id: undefined, player_b_id: undefined, result: undefined, created_at: '2026-04-01T00:00:00Z' },
  // Final (TBD)
  { id: 'kf7', season_id: 's1', round: 'final', player_a_id: undefined, player_b_id: undefined, result: undefined, created_at: '2026-04-01T00:00:00Z' },
]

// ─── Wagers ────────────────────────────────────────────────────────────────────

export const WAGERS: Wager[] = [
  { id: 'w1', proposer_id: 'p4', opponent_id: 'p1', amount: 20.00, status: 'settled', result_winner_id: 'p4', result_margin: '2 Up', result_course: 'Royal Dublin', result_played_at: '2026-03-08', proposer_confirmed: true, opponent_confirmed: true, settled_at: '2026-03-08T20:00:00Z', created_at: '2026-03-07T10:00:00Z' },
  { id: 'w2', proposer_id: 'p6', opponent_id: 'p11', amount: 50.00, status: 'settled', result_winner_id: 'p6', result_margin: '3&2', result_course: 'Portmarnock Links', result_played_at: '2026-03-15', proposer_confirmed: true, opponent_confirmed: true, settled_at: '2026-03-15T19:00:00Z', created_at: '2026-03-14T09:00:00Z' },
  { id: 'w3', proposer_id: 'p2', opponent_id: 'p9', amount: 30.00, status: 'active', result_winner_id: undefined, proposer_confirmed: false, opponent_confirmed: false, created_at: '2026-04-01T11:00:00Z' },
  { id: 'w4', proposer_id: 'p14', opponent_id: 'p16', amount: 100.00, status: 'pending_acceptance', result_winner_id: undefined, proposer_confirmed: false, opponent_confirmed: false, created_at: '2026-04-05T14:30:00Z' },
  { id: 'w5', proposer_id: 'p8', opponent_id: 'p12', amount: 25.00, status: 'pending_confirmation', result_winner_id: 'p8', result_margin: '1 Up', result_course: 'Druids Glen', result_played_at: '2026-04-04', proposer_confirmed: true, opponent_confirmed: false, created_at: '2026-04-03T09:00:00Z' },
  { id: 'w6', proposer_id: 'p3', opponent_id: 'p7', amount: 15.00, status: 'disputed', result_winner_id: 'p3', result_margin: '2&1', result_course: 'European Club', result_played_at: '2026-04-02', proposer_confirmed: true, opponent_confirmed: false, created_at: '2026-04-01T08:00:00Z' },
]

// ─── Wallet Transactions ───────────────────────────────────────────────────────

export const WALLET_TRANSACTIONS: WalletTransaction[] = [
  { id: 'wt1', player_id: 'p4', amount: 20.00, type: 'wager_win', reference_id: 'w1', created_at: '2026-03-08T20:00:00Z' },
  { id: 'wt2', player_id: 'p1', amount: -20.00, type: 'wager_loss', reference_id: 'w1', created_at: '2026-03-08T20:00:00Z' },
  { id: 'wt3', player_id: 'p6', amount: 50.00, type: 'wager_win', reference_id: 'w2', created_at: '2026-03-15T19:00:00Z' },
  { id: 'wt4', player_id: 'p11', amount: -50.00, type: 'wager_loss', reference_id: 'w2', created_at: '2026-03-15T19:00:00Z' },
  { id: 'wt5', player_id: 'p1', amount: 100.00, type: 'admin_credit', note: 'Opening balance', created_at: '2026-01-01T00:00:00Z' },
  { id: 'wt6', player_id: 'p2', amount: 200.00, type: 'admin_credit', note: 'Opening balance', created_at: '2026-01-01T00:00:00Z' },
]

// ─── Activity Feed ─────────────────────────────────────────────────────────────

export const ACTIVITY_FEED: ActivityFeedItem[] = [
  { id: 'af1', season_id: 's1', type: 'matchplay', actor_id: 'p2', secondary_actor_id: 'p3', description: 'Jamie Walsh beat Darragh Brennan 1 Up at European Club', metadata: { margin: '1 Up', course: 'European Club', result: 'win_a' }, created_at: '2026-03-20T16:00:00Z' },
  { id: 'af2', season_id: 's1', type: 'bonus_points', actor_id: 'p2', description: 'Jamie Walsh earned 1.5 bonus points (Sub-Season 1 winner)', metadata: { points: 1.5, sub_season: 'Sub-Season 1' }, created_at: '2026-04-01T09:00:00Z' },
  { id: 'af3', season_id: 's1', type: 'bonus_points', actor_id: 'p14', description: 'Alan Keane earned 1.0 bonus points (Sub-Season 1 runner-up)', metadata: { points: 1.0, sub_season: 'Sub-Season 1' }, created_at: '2026-04-01T09:01:00Z' },
  { id: 'af4', season_id: 's1', type: 'knockout', actor_id: 'p2', secondary_actor_id: 'p11', description: 'Jamie Walsh advanced past Barry Nolan 2&1 in the Quarter Final', metadata: { margin: '2&1', round: 'qf' }, created_at: '2026-04-12T17:30:00Z' },
  { id: 'af5', season_id: 's1', type: 'wager', actor_id: 'p6', secondary_actor_id: 'p11', description: 'Finn McCarthy won €50 from Barry Nolan', metadata: { amount: 50 }, created_at: '2026-03-15T19:00:00Z' },
  { id: 'af6', season_id: 's1', type: 'strokeplay', actor_id: 'p16', description: 'Niall Coffey shot a net 70 at Lahinch', metadata: { net_score: 70, course: 'Lahinch' }, created_at: '2026-04-04T18:30:00Z' },
  { id: 'af7', season_id: 's1', type: 'matchplay', actor_id: 'p16', secondary_actor_id: 'p13', description: 'Niall Coffey beat Pat Quinlan 6&5 at Portmarnock Links', metadata: { margin: '6&5', course: 'Portmarnock Links' }, created_at: '2026-02-16T16:00:00Z' },
  { id: 'af8', season_id: 's1', type: 'matchplay', actor_id: 'p6', secondary_actor_id: 'p8', description: 'Finn McCarthy beat Eoin Gallagher 3&2 at The K Club', metadata: { margin: '3&2', course: 'The K Club' }, created_at: '2026-03-08T17:00:00Z' },
  { id: 'af9', season_id: 's1', type: 'strokeplay', actor_id: 'p2', description: 'Jamie Walsh shot a net 72 at Ballybunion', metadata: { net_score: 72, course: 'Ballybunion' }, created_at: '2026-04-02T19:00:00Z' },
  { id: 'af10', season_id: 's1', type: 'matchplay', actor_id: 'p14', secondary_actor_id: 'p17', description: 'Alan Keane beat Tom Higgins 7&6 at European Club', metadata: { margin: '7&6', course: 'European Club' }, created_at: '2026-03-14T17:00:00Z' },
  { id: 'af11', season_id: 's1', type: 'wager', actor_id: 'p4', secondary_actor_id: 'p1', description: 'Sean O\'Brien won €20 from Conor Murphy', metadata: { amount: 20 }, created_at: '2026-03-08T20:00:00Z' },
  { id: 'af12', season_id: 's1', type: 'matchplay', actor_id: 'p11', secondary_actor_id: 'p9', description: 'Barry Nolan beat Rory Flanagan 4&2 at European Club', metadata: { margin: '4&2', course: 'European Club' }, created_at: '2026-02-12T16:30:00Z' },
]

// ─── Notifications ─────────────────────────────────────────────────────────────

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', recipient_id: 'p16', type: 'wager_request', reference_id: 'w4', message: 'Alan Keane has challenged you to a €100 wager', is_read: false, created_at: '2026-04-05T14:30:00Z' },
  { id: 'n2', recipient_id: 'p12', type: 'wager_result', reference_id: 'w5', message: 'Eoin Gallagher has entered the result for your wager. Please confirm.', is_read: false, created_at: '2026-04-04T20:00:00Z' },
  { id: 'n3', recipient_id: 'p2', type: 'sub_season_closed', reference_id: 'ss1', message: 'Sub-Season 1 is closed. You earned 1.5 bonus points!', is_read: true, created_at: '2026-04-01T09:00:00Z' },
  { id: 'n4', recipient_id: 'p2', type: 'bracket_set', reference_id: 'kf1', message: 'Knockout bracket is set. You play Barry Nolan in the Quarter Final.', is_read: true, created_at: '2026-04-01T08:00:00Z' },
  { id: 'n5', recipient_id: 'p1', type: 'bracket_set', reference_id: 'kf3', message: 'Knockout bracket is set. You play Alan Keane in the Quarter Final.', is_read: false, created_at: '2026-04-01T08:00:00Z' },
]

// ─── Tour ──────────────────────────────────────────────────────────────────────

export const TOUR_EVENT: TourEvent = {
  id: 't1',
  name: 'Tour 2026',
  status: 'active',
  target_points: 8.5,
  created_at: '2026-03-01T00:00:00Z',
}

// 16 players in Tour (all except p17 - Tom Higgins)
export const TOUR_PLAYERS: TourPlayer[] = [
  { id: 'tp1', tour_id: 't1', player_id: 'p1', team: '93s', locked_handicap: 12, seed: 9, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tp2', tour_id: 't1', player_id: 'p2', team: '91s', locked_handicap: 8, seed: 3, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tp3', tour_id: 't1', player_id: 'p3', team: '93s', locked_handicap: 15, seed: 12, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tp4', tour_id: 't1', player_id: 'p4', team: '91s', locked_handicap: 10, seed: 7, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tp5', tour_id: 't1', player_id: 'p5', team: '93s', locked_handicap: 18, seed: 15, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tp6', tour_id: 't1', player_id: 'p6', team: '91s', locked_handicap: 6, seed: 2, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tp7', tour_id: 't1', player_id: 'p7', team: '93s', locked_handicap: 14, seed: 11, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tp8', tour_id: 't1', player_id: 'p8', team: '91s', locked_handicap: 9, seed: 6, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tp9', tour_id: 't1', player_id: 'p9', team: '93s', locked_handicap: 11, seed: 8, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tp10', tour_id: 't1', player_id: 'p10', team: '91s', locked_handicap: 16, seed: 14, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tp11', tour_id: 't1', player_id: 'p11', team: '93s', locked_handicap: 7, seed: 4, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tp12', tour_id: 't1', player_id: 'p12', team: '91s', locked_handicap: 13, seed: 10, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tp13', tour_id: 't1', player_id: 'p13', team: '93s', locked_handicap: 20, seed: 16, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tp14', tour_id: 't1', player_id: 'p14', team: '91s', locked_handicap: 5, seed: 1, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tp15', tour_id: 't1', player_id: 'p15', team: '93s', locked_handicap: 17, seed: 13, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tp16', tour_id: 't1', player_id: 'p16', team: '91s', locked_handicap: 3, seed: 5, created_at: '2026-03-01T00:00:00Z' },
]

export const getTourPlayer = (id: string) => TOUR_PLAYERS.find((tp) => tp.id === id)!
export const getTourPlayerByPlayerId = (playerId: string) => TOUR_PLAYERS.find((tp) => tp.player_id === playerId)

export const TOUR_COURSE: TourCourse = {
  id: 'tc1',
  tour_id: 't1',
  name: 'Adare Manor',
  created_at: '2026-03-01T00:00:00Z',
}

export const TOUR_HOLES: TourHole[] = Array.from({ length: 18 }, (_, i) => ({
  id: `th${i + 1}`,
  course_id: 'tc1',
  hole_number: i + 1,
  par: [4, 3, 4, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 4, 5][i],
  stroke_index: [3, 17, 7, 11, 1, 15, 5, 9, 13, 4, 18, 8, 12, 2, 16, 6, 10, 14][i],
  created_at: '2026-03-01T00:00:00Z',
}))

export const TOUR_FORMATS: TourFormat[] = [
  { id: 'tf1', name: 'Better Ball Stableford', description: '2v2 pairs, best stableford score per hole counts', scoring_rules: { type: 'better_ball_stableford' }, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tf2', name: 'Foursomes', description: 'Alternate shot format', scoring_rules: { type: 'foursomes_matchplay' }, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tf3', name: 'Singles Matchplay', description: '1v1 matchplay', scoring_rules: { type: 'singles_matchplay' }, created_at: '2026-03-01T00:00:00Z' },
]

export const TOUR_DAYS: TourDay[] = [
  { id: 'td1', tour_id: 't1', day_number: 1, course_id: 'tc1', format_id: 'tf1', status: 'complete', played_at: '2026-04-18', created_at: '2026-03-01T00:00:00Z' },
  { id: 'td2', tour_id: 't1', day_number: 2, course_id: 'tc1', format_id: 'tf2', status: 'in_progress', played_at: '2026-04-19', created_at: '2026-03-01T00:00:00Z' },
  { id: 'td3', tour_id: 't1', day_number: 3, course_id: 'tc1', format_id: 'tf3', status: 'setup', played_at: '2026-04-20', created_at: '2026-03-01T00:00:00Z' },
]

export const TOUR_MATCHES: TourMatch[] = [
  // Day 1 - Better Ball (complete)
  { id: 'tm1', tour_day_id: 'td1', team_a: '93s', team_b: '91s', status: 'complete', team_a_points: 0, team_b_points: 1, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tm2', tour_day_id: 'td1', team_a: '93s', team_b: '91s', status: 'complete', team_a_points: 1, team_b_points: 0, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tm3', tour_day_id: 'td1', team_a: '93s', team_b: '91s', status: 'complete', team_a_points: 0.5, team_b_points: 0.5, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tm4', tour_day_id: 'td1', team_a: '91s', team_b: '93s', status: 'complete', team_a_points: 1, team_b_points: 0, created_at: '2026-03-01T00:00:00Z' },
  // Day 2 - Foursomes (in progress)
  { id: 'tm5', tour_day_id: 'td2', team_a: '93s', team_b: '91s', status: 'in_progress', team_a_points: 0, team_b_points: 0, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tm6', tour_day_id: 'td2', team_a: '91s', team_b: '93s', status: 'scheduled', team_a_points: 0, team_b_points: 0, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tm7', tour_day_id: 'td2', team_a: '93s', team_b: '91s', status: 'scheduled', team_a_points: 0, team_b_points: 0, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tm8', tour_day_id: 'td2', team_a: '91s', team_b: '93s', status: 'scheduled', team_a_points: 0, team_b_points: 0, created_at: '2026-03-01T00:00:00Z' },
  // Day 3 - Singles (setup)
  { id: 'tm9', tour_day_id: 'td3', team_a: '93s', team_b: '91s', status: 'scheduled', team_a_points: 0, team_b_points: 0, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tm10', tour_day_id: 'td3', team_a: '91s', team_b: '93s', status: 'scheduled', team_a_points: 0, team_b_points: 0, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tm11', tour_day_id: 'td3', team_a: '93s', team_b: '91s', status: 'scheduled', team_a_points: 0, team_b_points: 0, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tm12', tour_day_id: 'td3', team_a: '91s', team_b: '93s', status: 'scheduled', team_a_points: 0, team_b_points: 0, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tm13', tour_day_id: 'td3', team_a: '93s', team_b: '91s', status: 'scheduled', team_a_points: 0, team_b_points: 0, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tm14', tour_day_id: 'td3', team_a: '91s', team_b: '93s', status: 'scheduled', team_a_points: 0, team_b_points: 0, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tm15', tour_day_id: 'td3', team_a: '93s', team_b: '91s', status: 'scheduled', team_a_points: 0, team_b_points: 0, created_at: '2026-03-01T00:00:00Z' },
  { id: 'tm16', tour_day_id: 'td3', team_a: '91s', team_b: '93s', status: 'scheduled', team_a_points: 0, team_b_points: 0, created_at: '2026-03-01T00:00:00Z' },
]

export const TOUR_MATCH_PLAYERS: TourMatchPlayer[] = [
  // Match 1: tp1+tp3 (93s) vs tp2+tp4 (91s)
  { id: 'tmp1', match_id: 'tm1', tour_player_id: 'tp1', team: '93s', pair_index: 0 },
  { id: 'tmp2', match_id: 'tm1', tour_player_id: 'tp3', team: '93s', pair_index: 1 },
  { id: 'tmp3', match_id: 'tm1', tour_player_id: 'tp2', team: '91s', pair_index: 0 },
  { id: 'tmp4', match_id: 'tm1', tour_player_id: 'tp4', team: '91s', pair_index: 1 },
  // Match 2: tp5+tp7 (93s) vs tp6+tp8 (91s)
  { id: 'tmp5', match_id: 'tm2', tour_player_id: 'tp5', team: '93s', pair_index: 0 },
  { id: 'tmp6', match_id: 'tm2', tour_player_id: 'tp7', team: '93s', pair_index: 1 },
  { id: 'tmp7', match_id: 'tm2', tour_player_id: 'tp6', team: '91s', pair_index: 0 },
  { id: 'tmp8', match_id: 'tm2', tour_player_id: 'tp8', team: '91s', pair_index: 1 },
  // Match 3: tp9+tp11 (93s) vs tp10+tp12 (91s)
  { id: 'tmp9', match_id: 'tm3', tour_player_id: 'tp9', team: '93s', pair_index: 0 },
  { id: 'tmp10', match_id: 'tm3', tour_player_id: 'tp11', team: '93s', pair_index: 1 },
  { id: 'tmp11', match_id: 'tm3', tour_player_id: 'tp10', team: '91s', pair_index: 0 },
  { id: 'tmp12', match_id: 'tm3', tour_player_id: 'tp12', team: '91s', pair_index: 1 },
  // Match 4: tp13+tp15 (93s) vs tp14+tp16 (91s)
  { id: 'tmp13', match_id: 'tm4', tour_player_id: 'tp14', team: '91s', pair_index: 0 },
  { id: 'tmp14', match_id: 'tm4', tour_player_id: 'tp16', team: '91s', pair_index: 1 },
  { id: 'tmp15', match_id: 'tm4', tour_player_id: 'tp13', team: '93s', pair_index: 0 },
  { id: 'tmp16', match_id: 'tm4', tour_player_id: 'tp15', team: '93s', pair_index: 1 },
  // Day 2 Match 5
  { id: 'tmp17', match_id: 'tm5', tour_player_id: 'tp1', team: '93s', pair_index: 0 },
  { id: 'tmp18', match_id: 'tm5', tour_player_id: 'tp9', team: '93s', pair_index: 1 },
  { id: 'tmp19', match_id: 'tm5', tour_player_id: 'tp6', team: '91s', pair_index: 0 },
  { id: 'tmp20', match_id: 'tm5', tour_player_id: 'tp14', team: '91s', pair_index: 1 },
]

// Tour Chumps Picks
export const TOUR_CHUMPS_PICKS: TourChumpsPick[] = [
  { id: 'tcp1', tour_id: 't1', picker_id: 'p17', pick_1_id: 'tp14', pick_2_id: 'tp6', pick_3_id: 'tp16', pick_4_id: 'tp2', captain_id: 'tp14', captain_day: 2, locked_at: '2026-04-17T20:00:00Z', created_at: '2026-04-17T15:00:00Z' },
  { id: 'tcp2', tour_id: 't1', picker_id: 'p1', pick_1_id: 'tp11', pick_2_id: 'tp9', pick_3_id: 'tp14', pick_4_id: 'tp4', captain_id: 'tp11', captain_day: 1, locked_at: '2026-04-17T20:00:00Z', created_at: '2026-04-17T16:00:00Z' },
  { id: 'tcp3', tour_id: 't1', picker_id: 'p3', pick_1_id: 'tp2', pick_2_id: 'tp8', pick_3_id: 'tp11', pick_4_id: 'tp16', captain_id: 'tp2', captain_day: 3, locked_at: '2026-04-17T20:00:00Z', created_at: '2026-04-17T17:00:00Z' },
]

// ─── Computed helpers ──────────────────────────────────────────────────────────

export function getTourTeamScore(tourMatches: TourMatch[]): { '93s': number; '91s': number } {
  let score93s = 0
  let score91s = 0

  tourMatches
    .filter((m) => m.status === 'complete')
    .forEach((m) => {
      if (m.team_a === '93s') {
        score93s += m.team_a_points
        score91s += m.team_b_points
      } else {
        score91s += m.team_a_points
        score93s += m.team_b_points
      }
    })

  return { '93s': score93s, '91s': score91s }
}
