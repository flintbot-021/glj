import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useSaveTourHoles, useTourMatchBundle } from '@/hooks/use-data'
import { HoleStrip } from '@/components/tour/hole-strip'
import { ScoreMark } from '@/components/tour/score-mark'
import { computeTourHoleScore, getStrokesReceived } from '@/lib/scoring'
import { holeFormatLabel, computeMatchPlay, matchFormatFromTourFormat, type ComputedMatch } from '@/lib/tour-scoring'
import { TEAM_BLUE, TEAM_RED, TOUR_GOLD, TOUR_GOLD_FG, TOUR_GREEN } from '@/lib/tour-colors'
import { profileFirstName } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { TourMatchPlayerView } from '@/lib/tour-board'
import type { TourHole, TourHoleScore, TourTeam } from '@/lib/types'

function draftKey(playerId: string, hole: number) {
  return `${playerId}:${hole}`
}

export function TourScoringPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const [params] = useSearchParams()
  const viewOnly = params.get('mode') === 'view'
  const navigate = useNavigate()
  const { data: bundle, isLoading } = useTourMatchBundle(matchId)
  const save = useSaveTourHoles()
  const [currentHole, setCurrentHole] = useState(1)
  const [draft, setDraft] = useState<Record<string, number>>({})
  const persistTimers = useRef(new Map<string, number>())
  const started = useRef(false)

  useEffect(() => {
    started.current = false
    setCurrentHole(1)
    setDraft({})
  }, [matchId])

  useEffect(() => {
    if (!bundle || started.current) return
    started.current = true
    if (bundle.computed.closed) {
      const lastPlayed = [...bundle.computed.holes].reverse().find((h) => h.winner != null)
      setCurrentHole(lastPlayed?.hole ?? 1)
      return
    }
    const firstOpen = bundle.computed.holes.find((h) => h.winner == null)
    setCurrentHole(firstOpen?.hole ?? 1)
  }, [bundle])

  const hole = bundle?.holes.find((h) => h.hole_number === currentHole)
  const allPlayers = bundle ? [...bundle.playersA, ...bundle.playersB] : []

  const existingGross = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of bundle?.scores ?? []) {
      map.set(draftKey(s.tour_player_id, s.hole_number), s.gross_score)
    }
    return map
  }, [bundle?.scores])

  const displayGross = (playerId: string, holeNumber = currentHole) =>
    draft[draftKey(playerId, holeNumber)] ?? existingGross.get(draftKey(playerId, holeNumber)) ?? 0

  const liveComputed = useMemo(() => {
    if (!bundle) return null
    const players = [...bundle.playersA, ...bundle.playersB]
    const overlay = overlayDraftScores(bundle.scores, draft, players, bundle.holes)
    return computeMatchPlay(
      overlay,
      bundle.playersA.map((p) => p.id),
      bundle.playersB.map((p) => p.id),
      bundle.match.team_a,
      bundle.match.team_b,
      matchFormatFromTourFormat(bundle.format),
      bundle.holes,
    )
  }, [bundle, draft])

  const persistPlayer = (
    player: TourMatchPlayerView,
    gross: number,
    holeNumber: number,
    holeDef: TourHole,
  ) => {
    if (!bundle || !matchId) return
    const key = draftKey(player.id, holeNumber)
    const prev = persistTimers.current.get(key)
    if (prev) window.clearTimeout(prev)
    const timeout = window.setTimeout(() => {
      const { net, stableford } =
        gross < 1 ? { net: 0, stableford: 0 } : computeTourHoleScore(gross, holeDef, player.course_handicap_day)
      void save.mutateAsync({
        rows: [
          {
            match_id: matchId,
            tour_player_id: player.id,
            hole_number: holeNumber,
            gross_score: gross,
            net_score: net,
            stableford_points: stableford,
          },
        ],
        ctx: {
          matchId,
          playerIdsA: bundle.playersA.map((p) => p.id),
          playerIdsB: bundle.playersB.map((p) => p.id),
          teamA: bundle.match.team_a,
          teamB: bundle.match.team_b,
          spec: matchFormatFromTourFormat(bundle.format),
          holes: bundle.holes.map((h) => ({ hole_number: h.hole_number, par: h.par })),
        },
      })
    }, 160)
    persistTimers.current.set(key, timeout)
  }

  const bump = (playerId: string, delta: number) => {
    const player = allPlayers.find((p) => p.id === playerId)
    if (!player || !hole) return
    const next = Math.max(0, Math.min(15, displayGross(playerId) + delta))
    const holeNumber = currentHole
    setDraft((prev) => ({ ...prev, [draftKey(playerId, holeNumber)]: next }))
    persistPlayer(player, next, holeNumber, hole)
  }

  const holeView = liveComputed?.holes[currentHole - 1]

  if (isLoading || !bundle) {
    return (
      <div className="h-dvh flex items-center justify-center" style={{ backgroundColor: TOUR_GREEN }}>
        <p className="text-white/60">Loading match…</p>
      </div>
    )
  }

  if (!bundle.holes.length) {
    return (
      <div
        className="h-dvh flex flex-col items-center justify-center gap-3 px-6"
        style={{ backgroundColor: TOUR_GREEN }}
      >
        <p className="text-white font-bold text-center">Course not set yet</p>
        <p className="text-white/60 text-sm text-center">
          Assign a course to this day before scoring holes.
        </p>
        <button
          type="button"
          className="text-sm font-semibold mt-2"
          style={{ color: TOUR_GOLD }}
          onClick={() => navigate('/tour')}
        >
          Back to Tour
        </button>
      </div>
    )
  }

  if (!hole || !liveComputed) {
    return (
      <div className="h-dvh flex items-center justify-center" style={{ backgroundColor: TOUR_GREEN }}>
        <p className="text-white/60">Loading match…</p>
      </div>
    )
  }

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden"
      style={{ backgroundColor: TOUR_GREEN, paddingTop: 'env(safe-area-inset-top)' }}
    >
      <header className="px-3 pt-2 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="size-9 rounded-full flex items-center justify-center text-white/70 active:bg-white/10"
            onClick={() => navigate('/tour')}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <p className="text-white/55 text-[11px] font-bold">
            Day {bundle.dayNumber} · Match {bundle.matchNumber}
          </p>
          <span className="w-9" />
        </div>

        <MatchStandings
          computed={liveComputed}
          teamA={bundle.match.team_a}
        />

        <div className="mt-3">
          <HoleStrip holes={liveComputed.holes} current={currentHole} onSelect={setCurrentHole} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <StatTile value={currentHole} label="Hole" />
          <StatTile value={hole.par} label="Par" />
          <StatTile value={hole.stroke_index} label="SI" />
        </div>
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-white/45 mt-2">
          {holeFormatLabel(matchFormatFromTourFormat(bundle.format), hole.par)}
        </p>
      </header>

      <div className="flex-1 min-h-0 bg-background rounded-t-3xl flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 grid grid-cols-2 divide-x divide-border">
          <TeamColumn
            team={bundle.match.team_a}
            players={bundle.playersA}
            hole={hole}
            displayGross={displayGross}
            bump={bump}
            viewOnly={viewOnly}
            sidePoints={holeView?.aPoints ?? null}
            formatSpec={matchFormatFromTourFormat(bundle.format)}
          />
          <TeamColumn
            team={bundle.match.team_b}
            players={bundle.playersB}
            hole={hole}
            displayGross={displayGross}
            bump={bump}
            viewOnly={viewOnly}
            sidePoints={holeView?.bPoints ?? null}
            formatSpec={matchFormatFromTourFormat(bundle.format)}
          />
        </div>

        <footer
          className="shrink-0 px-3 pt-2 space-y-2 border-t border-border bg-background"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <HoleWinnerBar
            winnerTeam={holeView?.winnerTeam ?? null}
            pointsA={holeView?.aPoints ?? null}
            pointsB={holeView?.bPoints ?? null}
            teamA={bundle.match.team_a}
            teamB={bundle.match.team_b}
          />
          <button
            type="button"
            className="w-full h-12 rounded-xl text-sm font-black flex items-center justify-center gap-1 active:scale-[0.99]"
            style={{ backgroundColor: TOUR_GOLD, color: TOUR_GOLD_FG }}
            onClick={() => {
              if (currentHole >= 18) {
                navigate('/tour')
                return
              }
              setCurrentHole((h) => h + 1)
            }}
          >
            {currentHole >= 18 ? 'Done' : 'Next hole'}
            {currentHole < 18 && <ChevronRight className="h-4 w-4" />}
          </button>
        </footer>
      </div>
    </div>
  )
}

function MatchStandings({
  computed,
  teamA,
}: {
  computed: ComputedMatch
  teamA: TourTeam
}) {
  const wins93 = teamA === '93s' ? computed.aWins : computed.bWins
  const wins91 = teamA === '91s' ? computed.aWins : computed.bWins
  const remaining = computed.closed ? 0 : 18 - computed.holesPlayed
  const leadColor =
    computed.leader === '93s' ? TEAM_BLUE : computed.leader === '91s' ? TEAM_RED : 'white'

  return (
    <div className="mt-1 rounded-2xl bg-black/20 px-3 py-2.5">
      <div className="flex items-center">
        <StandingsSide team="93s" wins={wins93} />
        <div className="flex-1 text-center px-2">
          <p className="text-2xl font-black leading-none tracking-wide" style={{ color: leadColor }}>
            {computed.holesPlayed === 0 ? 'AS' : computed.statusLabel}
          </p>
          <p className="text-[11px] font-bold text-white/50 mt-1">
            {computed.closed
              ? 'Match over'
              : remaining === 1
                ? '1 hole to play'
                : `${remaining} holes to play`}
            {computed.holesPlayed > 0 && !computed.closed && ` · thru ${computed.holesPlayed}`}
          </p>
        </div>
        <StandingsSide team="91s" wins={wins91} align="right" />
      </div>
    </div>
  )
}

function StandingsSide({ team, wins, align }: { team: TourTeam; wins: number; align?: 'right' }) {
  const color = team === '93s' ? TEAM_BLUE : TEAM_RED
  return (
    <div className={cn('w-[4.5rem]', align === 'right' && 'text-right')}>
      <span
        className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full text-white"
        style={{ backgroundColor: color }}
      >
        {team}
      </span>
      <p className="text-3xl font-black text-white leading-none mt-1 num">{wins}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">holes</p>
    </div>
  )
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 py-2 text-center text-white">
      <p className="text-4xl font-black leading-none num">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mt-1">{label}</p>
    </div>
  )
}

function overlayDraftScores(
  scores: TourHoleScore[],
  draft: Record<string, number>,
  players: TourMatchPlayerView[],
  holes: TourHole[],
): Pick<TourHoleScore, 'tour_player_id' | 'hole_number' | 'stableford_points' | 'net_score'>[] {
  const map = new Map<string, { tour_player_id: string; hole_number: number; stableford_points: number; net_score: number }>()
  for (const s of scores) {
    map.set(draftKey(s.tour_player_id, s.hole_number), {
      tour_player_id: s.tour_player_id,
      hole_number: s.hole_number,
      stableford_points: s.stableford_points,
      net_score: s.net_score,
    })
  }
  const holeByNumber = new Map(holes.map((h) => [h.hole_number, h]))
  const playerById = new Map(players.map((p) => [p.id, p]))
  for (const [key, gross] of Object.entries(draft)) {
    const sep = key.lastIndexOf(':')
    const playerId = key.slice(0, sep)
    const holeNumber = Number(key.slice(sep + 1))
    const player = playerById.get(playerId)
    const holeDef = holeByNumber.get(holeNumber)
    if (!player || !holeDef) continue
    if (gross < 1) {
      map.delete(key)
      continue
    }
    const { stableford, net } = computeTourHoleScore(gross, holeDef, player.course_handicap_day)
    map.set(key, { tour_player_id: playerId, hole_number: holeNumber, stableford_points: stableford, net_score: net })
  }
  return [...map.values()]
}

function HoleWinnerBar({
  winnerTeam,
  pointsA,
  pointsB,
  teamA,
  teamB,
}: {
  winnerTeam: TourTeam | 'half' | null
  pointsA: number | null
  pointsB: number | null
  teamA: TourTeam
  teamB: TourTeam
}) {
  const waiting = winnerTeam == null
  const halved = winnerTeam === 'half'
  const bg = waiting ? 'oklch(0.94 0.01 157)' : halved ? TOUR_GOLD : winnerTeam === '93s' ? TEAM_BLUE : TEAM_RED
  const fg = waiting ? 'oklch(0.42 0.02 157)' : halved ? TOUR_GOLD_FG : 'white'
  const label = waiting ? 'Waiting' : halved ? 'Halved' : `${winnerTeam} win`

  return (
    <div
      className="h-12 rounded-xl flex items-center px-3"
      style={{ backgroundColor: bg, color: fg }}
    >
      <span className="w-16 text-sm font-black num">
        {teamA} {pointsA ?? '—'}
      </span>
      <span className="flex-1 text-center text-[11px] font-black uppercase tracking-[0.18em]">{label}</span>
      <span className="w-16 text-sm font-black num text-right">
        {pointsB ?? '—'} {teamB}
      </span>
    </div>
  )
}

function TeamColumn({
  team,
  players,
  hole,
  displayGross,
  bump,
  viewOnly,
  sidePoints,
  formatSpec,
}: {
  team: TourTeam
  players: TourMatchPlayerView[]
  hole: TourHole
  displayGross: (id: string) => number
  bump: (id: string, d: number) => void
  viewOnly: boolean
  sidePoints: number | null
  formatSpec: ReturnType<typeof matchFormatFromTourFormat>
}) {
  const color = team === '93s' ? TEAM_BLUE : TEAM_RED
  const combine = formatSpec.agg === 'by_par'
    ? formatSpec.par[hole.par as 3 | 4 | 5] ?? 'better_ball'
    : formatSpec.agg === 'better_ball'
      ? 'better_ball'
      : 'sum'
  return (
    <div className="flex flex-col min-h-0">
      <div className="shrink-0 flex items-center justify-center py-2">
        <span
          className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          {team}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-evenly min-h-0">
        {players.map((player) => {
          const gross = displayGross(player.id)
          const preview = gross ? computeTourHoleScore(gross, hole, player.course_handicap_day) : null
          const counting =
            preview != null &&
            sidePoints != null &&
            (combine !== 'better_ball' ||
              (formatSpec.compare === 'lower_net'
                ? preview.net === sidePoints
                : preview.stableford === sidePoints))
          const strokes = getStrokesReceived(player.course_handicap_day, hole.stroke_index)
          return (
            <PlayerScore
              key={player.id}
              name={profileFirstName(player.profile)}
              ch={player.course_handicap_day}
              strokes={strokes}
              gross={gross}
              stableford={preview?.stableford ?? null}
              counting={counting}
              accent={color}
              viewOnly={viewOnly}
              onMinus={() => bump(player.id, -1)}
              onPlus={() => bump(player.id, 1)}
            />
          )
        })}
      </div>
    </div>
  )
}

function PlayerScore({
  name,
  ch,
  strokes,
  gross,
  stableford,
  counting,
  accent,
  viewOnly,
  onMinus,
  onPlus,
}: {
  name: string
  ch: number
  strokes: number
  gross: number
  stableford: number | null
  counting: boolean
  accent: string
  viewOnly: boolean
  onMinus: () => void
  onPlus: () => void
}) {
  return (
    <div className="flex flex-col items-center px-2 py-1">
      <p className="text-sm font-black leading-none truncate max-w-full">{name}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        CH {ch}
        {strokes > 0 && <span className="ml-1 tracking-tight">{'●'.repeat(Math.min(strokes, 3))}</span>}
      </p>
      <div className="flex items-center gap-1.5 mt-1.5">
        {!viewOnly && (
          <button
            type="button"
            onClick={onMinus}
            className="size-10 rounded-xl border border-border text-xl font-black text-muted-foreground active:bg-muted"
          >
            −
          </button>
        )}
        <ScoreMark gross={gross} stableford={stableford} />
        {!viewOnly && (
          <button
            type="button"
            onClick={onPlus}
            className="size-10 rounded-xl border border-border text-xl font-black text-muted-foreground active:bg-muted"
          >
            +
          </button>
        )}
      </div>
      <p
        className={cn('text-[11px] font-black mt-1', !counting && 'text-muted-foreground/70')}
        style={{ color: counting ? accent : undefined }}
      >
        {stableford == null ? '—' : `${stableford} pts`}
      </p>
    </div>
  )
}
