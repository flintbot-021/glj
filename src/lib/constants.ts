// Match margins for matchplay
export const MATCHPLAY_MARGINS = [
  'All Square',
  'Halved',
  '1 Up',
  '2 Up',
  '2&1',
  '3 Up',
  '3&2',
  '4 Up',
  '4&3',
  '5 Up',
  '5&4',
  '6 Up',
  '6&5',
  '7 Up',
  '7&6',
  '8 Up',
  '8&7',
  '9 Up',
  '9&8',
  '10&8',
]

// Tour format names
export const TOUR_FORMATS = {
  BETTER_BALL_STABLEFORD: 'Better Ball Stableford',
  FOURSOMES: 'Foursomes',
  SINGLES_MATCHPLAY: 'Singles Matchplay',
  FOUR_BALL: 'Four Ball Matchplay',
}

// Wager status display labels
export const WAGER_STATUS_LABELS: Record<string, string> = {
  pending_acceptance: 'Pending',
  active: 'Active',
  pending_confirmation: 'Awaiting Confirmation',
  settled: 'Settled',
  disputed: 'Disputed',
}

export const WAGER_STATUS_COLORS: Record<string, string> = {
  pending_acceptance: 'bg-yellow-500/20 text-yellow-700',
  active: 'bg-blue-500/20 text-blue-700',
  pending_confirmation: 'bg-orange-500/20 text-orange-700',
  settled: 'bg-green-500/20 text-green-700',
  disputed: 'bg-red-500/20 text-red-700',
}

// Nav tabs
export const NAV_TABS = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'bracket', label: 'Bracket', path: '/bracket' },
  { id: 'enter', label: 'Score', path: null }, // CTA - no route
  { id: 'wagers', label: 'Wagers', path: '/wagers' },
  { id: 'profile', label: 'Me', path: '/profile' },
]

// Season defaults
export const SEASON_DEFAULTS = {
  WIN_POINTS: 3,
  DRAW_POINTS: 1,
  LOSS_POINTS: 0,
  BONUS_1ST: 1.5,
  BONUS_2ND: 1.0,
  BONUS_3RD: 0.5,
}

// Tour defaults
export const TOUR_DEFAULTS = {
  TARGET_POINTS: 8.5,
}

// Stableford scoring
export const STABLEFORD_POINTS = {
  ALBATROSS: 5,
  EAGLE: 4,
  BIRDIE: 3,
  PAR: 2,
  BOGEY: 1,
  DOUBLE_BOGEY_OR_WORSE: 0,
}

export const KNOWN_COURSES = [
  'Royal Dublin',
  'Portmarnock Links',
  'The K Club',
  'Mount Juliet',
  'Druids Glen',
  'Adare Manor',
  'Old Head of Kinsale',
  'Ballybunion',
  'Lahinch',
  'Waterville',
  'Carnoustie',
  'St Andrews Old Course',
  'Royal Portrush',
  'Portmarnock',
  'European Club',
  'Fota Island',
  'Killarney Golf Club',
  'Tralee Golf Club',
  'Doonbeg',
  'Carne Golf Links',
]
