import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import {
  useClearTourMatchWager,
  useConfirmTourMatchCard,
  useResetTourMatchCard,
  useSaveTourHoles,
  useSetTourMatchWager,
  useTourMatchBundle,
} from '@/hooks/use-data'
import { useAuthStore } from '@/stores/auth-store'
import { HoleStrip } from '@/components/tour/hole-strip'
import { ScoreMark } from '@/components/tour/score-mark'
import { computeTourHoleScore, getStrokesReceived } from '@/lib/scoring'
import {
  holeFormatLabel,
  computeMatchPlay,
  isTourCardComplete,
  matchFormatFromTourFormat,
  type ComputedMatch,
} from '@/lib/tour-scoring'
import { TEAM_BLUE, TEAM_RED, TOUR_GOLD, TOUR_GOLD_FG, TOUR_GREEN } from '@/lib/tour-colors'
import { profileFirstName } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import type { TourMatchPlayerView, TourMatchView } from '@/lib/tour-board'
import type { TourHole, TourHoleScore, TourTeam } from '@/lib/types'

function draftKey(playerId: string, hole: number) {
  return `${playerId}:${hole}`
}

export function TourScoringPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const [params] = useSearchParams()
  const viewOnly = params.get('mode') === 'view'
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const { data: bundle, isLoading } = useTourMatchBundle(matchId)
  const save = useSaveTourHoles()
  const setWager = useSetTourMatchWager()
  const clearWager = useClearTourMatchWager()
  const confirmCard = useConfirmTourMatchCard()
  const resetCard = useResetTourMatchCard()
  const [currentHole, setCurrentHole] = useState(1)
  const [draft, setDraft] = useState<Record<string, number>>({})
  const [wagerSkipped, setWagerSkipped] = useState(false)
  const [wagerAmount, setWagerAmount] = useState('50')
  const [wagerError, setWagerError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [resetError, setResetError] = useState('')
  const [forceConfirm, setForceConfirm] = useState(false)
  const persistTimers = useRef(new Map<string, number>())
  const started = useRef(false)

  useEffect(() => {
    started.current = false
    setCurrentHole(1)
    setDraft({})
    setWagerSkipped(false)
    setForceConfirm(false)
    setWagerError('')
    setConfirmError('')
    setResetError('')
  }, [matchId])

  useEffect(() => {
    if (!bundle || started.current) return
    started.current = true
    if (bundle.computed.decided) {
      const firstOpen = [...Array.from({ length: 18 }, (_, i) => i + 1)].find((h) => {
        const players = [...bundle.playersA, ...bundle.playersB]
        return players.some((p) => {
          const g =
            draft[draftKey(p.id, h)] ??
            bundle.scores.find((s) => s.tour_player_id === p.id && s.hole_number === h)?.gross_score ??
            0
          return g < 1
        })
      })
      setCurrentHole(firstOpen ?? 18)
      return
    }
    const firstOpen = bundle.computed.holes.find((h) => h.winner == null)
    setCurrentHole(firstOpen?.hole ?? 1)
  }, [bundle])

  const hole = bundle?.holes.find((h) => h.hole_number === currentHole)
  const allPlayers = bundle ? [...bundle.playersA, ...bundle.playersB] : []
  const iAmInMatch = !!profile && allPlayers.some((p) => p.player_id === profile.id)

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

  const overlayScores = useMemo(() => {
    if (!bundle) return []
    return overlayDraftScores(bundle.scores, draft, allPlayers, bundle.holes)
  }, [bundle, draft, allPlayers])

  const cardComplete = useMemo(() => {
    if (!bundle) return false
    // Merge overlay gross into completeness check
    const merged = allPlayers.flatMap((p) =>
      Array.from({ length: 18 }, (_, i) => {
        const h = i + 1
        const gross = displayGross(p.id, h)
        return { tour_player_id: p.id, hole_number: h, gross_score: gross }
      }),
    )
    return isTourCardComplete(merged, allPlayers.map((p) => p.id))
  }, [bundle, allPlayers, draft, existingGross])

  const hasAnyScore = useMemo(() => {
    if ((bundle?.scores ?? []).some((s) => s.gross_score >= 1)) return true
    return Object.values(draft).some((g) => g >= 1)
  }, [bundle?.scores, draft])

  const showWagerGate =
    !viewOnly &&
    !!bundle &&
    iAmInMatch &&
    !bundle.match.card_confirmed_at &&
    bundle.match.wager_amount == null &&
    !hasAnyScore &&
    !wagerSkipped

  const showConfirm =
    !viewOnly &&
    !!bundle &&
    iAmInMatch &&
    !bundle.match.card_confirmed_at &&
    !!liveComputed?.decided &&
    cardComplete &&
    (forceConfirm || currentHole >= 18)

  const saveCtx = () => {
    if (!bundle || !matchId) return null
    return {
      matchId,
      playerIdsA: bundle.playersA.map((p) => p.id),
      playerIdsB: bundle.playersB.map((p) => p.id),
      teamA: bundle.match.team_a,
      teamB: bundle.match.team_b,
      spec: matchFormatFromTourFormat(bundle.format),
      holes: bundle.holes.map((h) => ({ hole_number: h.hole_number, par: h.par })),
    }
  }

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
      const ctx = saveCtx()
      if (!ctx) return
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
        ctx,
      })
    }, 160)
    persistTimers.current.set(key, timeout)
  }

  const flushDraft = async () => {
    const ctx = saveCtx()
    if (!bundle || !matchId || !ctx) return
    for (const t of persistTimers.current.values()) window.clearTimeout(t)
    persistTimers.current.clear()
    const rows = Object.entries(draft).flatMap(([key, gross]) => {
      const sep = key.lastIndexOf(':')
      const playerId = key.slice(0, sep)
      const holeNumber = Number(key.slice(sep + 1))
      const player = allPlayers.find((p) => p.id === playerId)
      const holeDef = bundle.holes.find((h) => h.hole_number === holeNumber)
      if (!player || !holeDef) return []
      const { net, stableford } =
        gross < 1
          ? { net: 0, stableford: 0 }
          : computeTourHoleScore(gross, holeDef, player.course_handicap_day)
      return [
        {
          match_id: matchId,
          tour_player_id: player.id,
          hole_number: holeNumber,
          gross_score: gross,
          net_score: net,
          stableford_points: stableford,
        },
      ]
    })
    if (rows.length === 0) return
    await save.mutateAsync({ rows, ctx })
  }

  const bump = (playerId: string, delta: number) => {
    const player = allPlayers.find((p) => p.id === playerId)
    if (!player || !hole || bundle?.match.card_confirmed_at) return
    const next = Math.max(0, Math.min(15, displayGross(playerId) + delta))
    const holeNumber = currentHole
    setDraft((prev) => ({ ...prev, [draftKey(playerId, holeNumber)]: next }))
    persistPlayer(player, next, holeNumber, hole)
  }

  const holeView = liveComputed?.holes[currentHole - 1]

  const canReset =
    !viewOnly &&
    !!matchId &&
    !!bundle &&
    (iAmInMatch || !!profile?.is_admin) &&
    (hasAnyScore ||
      bundle.match.wager_amount != null ||
      !!bundle.match.card_confirmed_at ||
      bundle.match.status !== 'scheduled')

  const handleResetScorecard = () => {
    if (!matchId || resetCard.isPending) return
    const settled = !!bundle?.match.wager_settled_at
    const priorWager = bundle?.match.wager_amount
    const ok = window.confirm(
      settled
        ? 'Reset this scorecard? All scores and the wager will be cleared, and any settled wallet amounts will be reversed. You’ll set the wager again from scratch.'
        : 'Reset this scorecard? All scores and the wager will be cleared, and you’ll start again from the wager prompt.',
    )
    if (!ok) return
    setResetError('')
    for (const t of persistTimers.current.values()) window.clearTimeout(t)
    persistTimers.current.clear()
    resetCard.mutate(matchId, {
      onSuccess: () => {
        started.current = false
        setDraft({})
        setCurrentHole(1)
        setWagerSkipped(false)
        setForceConfirm(false)
        if (priorWager != null) setWagerAmount(String(priorWager))
      },
      onError: (e) => setResetError(e instanceof Error ? e.message : 'Could not reset scorecard'),
    })
  }

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

  if (showWagerGate && matchId) {
    return (
      <WagerPrompt
        dayNumber={bundle.dayNumber}
        matchNumber={bundle.matchNumber}
        singles={bundle.playersA.length === 1}
        amount={wagerAmount}
        error={wagerError}
        busy={setWager.isPending || clearWager.isPending}
        onAmountChange={setWagerAmount}
        onSkip={() => setWagerSkipped(true)}
        onAdd={() => {
          const n = Number(wagerAmount)
          if (!Number.isFinite(n) || n <= 0) {
            setWagerError('Enter an amount greater than zero')
            return
          }
          setWagerError('')
          setWager.mutate(
            { matchId, amount: n },
            { onError: (e) => setWagerError(e instanceof Error ? e.message : 'Could not set wager') },
          )
        }}
        onBack={() => navigate('/tour')}
      />
    )
  }

  if (showConfirm && matchId && liveComputed) {
    return (
      <ConfirmCardScreen
        bundle={bundle}
        computed={liveComputed}
        overlayScores={overlayScores}
        error={confirmError}
        busy={confirmCard.isPending || save.isPending}
        onBack={() => setForceConfirm(false)}
        onConfirm={() => {
          setConfirmError('')
          void (async () => {
            try {
              await flushDraft()
              await confirmCard.mutateAsync(matchId)
              navigate('/tour')
            } catch (e) {
              setConfirmError(e instanceof Error ? e.message : 'Could not confirm')
            }
          })()
        }}
      />
    )
  }

  if (!hole || !liveComputed) {
    return (
      <div className="h-dvh flex items-center justify-center" style={{ backgroundColor: TOUR_GREEN }}>
        <p className="text-white/60">Loading match…</p>
      </div>
    )
  }

  const locked = !!bundle.match.card_confirmed_at

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden"
      style={{ backgroundColor: TOUR_GREEN, paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col">
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
              {bundle.match.wager_amount != null && (
                <span className="ml-2" style={{ color: TOUR_GOLD }}>
                  · R{bundle.match.wager_amount}
                </span>
              )}
            </p>
            {canReset ? (
              <button
                type="button"
                className="size-9 rounded-full flex items-center justify-center text-white/70 active:bg-white/10 disabled:opacity-40"
                onClick={handleResetScorecard}
                disabled={resetCard.isPending}
                aria-label="Reset scorecard"
                title="Reset scorecard"
              >
                <RotateCcw className={cn('h-4 w-4', resetCard.isPending && 'animate-spin')} />
              </button>
            ) : (
              <span className="w-9" />
            )}
          </div>
          {resetError && (
            <p className="text-center text-[11px] font-semibold text-red-300 mt-1">{resetError}</p>
          )}

          <MatchStandings
            computed={liveComputed}
            teamA={bundle.match.team_a}
            cardComplete={cardComplete}
            confirmed={locked}
            canConfirm={iAmInMatch}
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

        <div className="grow bg-background rounded-t-3xl">
          <div className="grid grid-cols-2 divide-x divide-border pb-2">
            <TeamColumn
              team={bundle.match.team_a}
              players={bundle.playersA}
              hole={hole}
              displayGross={displayGross}
              bump={bump}
              viewOnly={viewOnly || locked}
              sidePoints={holeView?.aPoints ?? null}
              formatSpec={matchFormatFromTourFormat(bundle.format)}
            />
            <TeamColumn
              team={bundle.match.team_b}
              players={bundle.playersB}
              hole={hole}
              displayGross={displayGross}
              bump={bump}
              viewOnly={viewOnly || locked}
              sidePoints={holeView?.bPoints ?? null}
              formatSpec={matchFormatFromTourFormat(bundle.format)}
            />
          </div>
        </div>
      </div>

      <footer
        className="relative z-[100] shrink-0 px-3 pt-2 space-y-2 border-t border-border bg-background shadow-[0_-10px_28px_rgba(0,0,0,0.12)]"
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
              if (!locked && iAmInMatch && liveComputed.decided && cardComplete) {
                setForceConfirm(true)
                return
              }
              if (!locked && liveComputed.decided && !cardComplete) {
                // Keep scoring — find first incomplete hole
                const players = allPlayers
                for (let h = 1; h <= 18; h++) {
                  if (players.some((p) => displayGross(p.id, h) < 1)) {
                    setCurrentHole(h)
                    return
                  }
                }
                navigate('/tour')
                return
              }
              navigate('/tour')
              return
            }
            setCurrentHole((h) => h + 1)
          }}
        >
          {currentHole >= 18
            ? liveComputed.decided && cardComplete && !locked && iAmInMatch
              ? 'Review & confirm'
              : liveComputed.decided && !cardComplete
                ? 'Finish remaining holes'
                : 'Done'
            : 'Next hole'}
          {currentHole < 18 && <ChevronRight className="h-4 w-4" />}
        </button>
      </footer>
    </div>
  )
}

function MatchStandings({
  computed,
  teamA,
  cardComplete,
  confirmed,
  canConfirm,
}: {
  computed: ComputedMatch
  teamA: TourTeam
  cardComplete: boolean
  confirmed: boolean
  canConfirm: boolean
}) {
  const wins93 = teamA === '93s' ? computed.aWins : computed.bWins
  const wins91 = teamA === '91s' ? computed.aWins : computed.bWins
  const remaining = computed.decided ? 0 : 18 - computed.holesPlayed
  const leadColor =
    computed.leader === '93s' ? TEAM_BLUE : computed.leader === '91s' ? TEAM_RED : 'white'

  let subtitle: string
  if (confirmed) subtitle = 'Confirmed'
  else if (computed.decided && cardComplete && canConfirm) subtitle = 'Card complete · confirm to settle'
  else if (computed.decided && cardComplete) subtitle = 'Card complete'
  else if (computed.decided) subtitle = 'Match decided · finish all 18 holes'
  else if (remaining === 1) subtitle = '1 hole to play'
  else subtitle = `${remaining} holes to play`
  if (computed.holesPlayed > 0 && !computed.decided) subtitle += ` · thru ${computed.holesPlayed}`

  return (
    <div className="mt-1 rounded-2xl bg-black/20 px-3 py-2.5">
      <div className="flex items-center">
        <StandingsSide team="93s" wins={wins93} />
        <div className="flex-1 text-center px-2">
          <p className="text-2xl font-black leading-none tracking-wide" style={{ color: leadColor }}>
            {computed.holesPlayed === 0 ? 'AS' : computed.statusLabel}
          </p>
          <p className="text-[11px] font-bold text-white/50 mt-1">{subtitle}</p>
        </div>
        <StandingsSide team="91s" wins={wins91} align="right" />
      </div>
    </div>
  )
}

function WagerPrompt({
  dayNumber,
  matchNumber,
  singles,
  amount,
  error,
  busy,
  onAmountChange,
  onSkip,
  onAdd,
  onBack,
}: {
  dayNumber: number
  matchNumber: number
  singles: boolean
  amount: string
  error: string
  busy: boolean
  onAmountChange: (v: string) => void
  onSkip: () => void
  onAdd: () => void
  onBack: () => void
}) {
  return (
    <div
      className="h-dvh flex flex-col"
      style={{ backgroundColor: TOUR_GREEN, paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="px-4 pt-2">
        <button
          type="button"
          className="size-9 rounded-full flex items-center justify-center text-white/70"
          onClick={onBack}
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-center px-6 pb-10">
        <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
          Day {dayNumber} · Match {matchNumber}
        </p>
        <h1 className="text-white text-3xl font-black mt-2 leading-tight">Add a wager?</h1>
        <p className="text-white/60 text-sm mt-2">
          {singles
            ? 'Loser pays this amount to the winner. Half = refund (no transfer).'
            : 'Each player on the losing side pays this amount; each winner receives it. Half = refund.'}
        </p>
        <label className="mt-6 block">
          <span className="text-white/50 text-[11px] font-bold uppercase tracking-wider">Amount (R)</span>
          <input
            className="mt-1.5 w-full h-14 rounded-2xl bg-white/10 text-white text-2xl font-black px-4 num outline-none ring-1 ring-white/15 focus:ring-white/40"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
        <button
          type="button"
          disabled={busy}
          className="mt-6 w-full h-12 rounded-xl text-sm font-black"
          style={{ backgroundColor: TOUR_GOLD, color: TOUR_GOLD_FG }}
          onClick={onAdd}
        >
          {busy ? 'Saving…' : 'Add wager & start'}
        </button>
        <button
          type="button"
          disabled={busy}
          className="mt-3 w-full h-12 rounded-xl text-sm font-bold text-white/70 border border-white/20"
          onClick={onSkip}
        >
          Skip — score without wager
        </button>
      </div>
    </div>
  )
}

function ConfirmCardScreen({
  bundle,
  computed,
  overlayScores,
  error,
  busy,
  onBack,
  onConfirm,
}: {
  bundle: TourMatchView
  computed: ComputedMatch
  overlayScores: Pick<
    TourHoleScore,
    'tour_player_id' | 'hole_number' | 'gross_score' | 'stableford_points' | 'net_score'
  >[]
  error: string
  busy: boolean
  onBack: () => void
  onConfirm: () => void
}) {
  const players = [...bundle.playersA, ...bundle.playersB]
  const half = computed.points93 === computed.points91
  const wager = bundle.match.wager_amount
  const winner =
    half ? null : computed.points93 > computed.points91 ? '93s' : '91s'

  const grossTotal = (playerId: string) =>
    overlayScores
      .filter((s) => s.tour_player_id === playerId)
      .reduce((sum, s) => sum + s.gross_score, 0)

  const sfTotal = (playerId: string) =>
    overlayScores
      .filter((s) => s.tour_player_id === playerId)
      .reduce((sum, s) => sum + s.stableford_points, 0)

  return (
    <div
      className="h-dvh flex flex-col overflow-hidden"
      style={{ backgroundColor: TOUR_GREEN, paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="px-4 pt-2 pb-3 flex items-center gap-2">
        <button
          type="button"
          className="size-9 rounded-full flex items-center justify-center text-white/70"
          onClick={onBack}
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-white/50 text-[11px] font-bold">
            Day {bundle.dayNumber} · Match {bundle.matchNumber}
          </p>
          <h1 className="text-white text-lg font-black">Confirm card</h1>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-background rounded-t-3xl overflow-y-auto px-4 pt-4 pb-6">
        <div className="rounded-2xl border border-border p-4 mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Match result</p>
          <p className="text-2xl font-black mt-1" style={{ color: winner === '93s' ? TEAM_BLUE : winner === '91s' ? TEAM_RED : undefined }}>
            {computed.statusLabel}
          </p>
        </div>

        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Player scores
        </p>
        <ul className="space-y-2 mb-4">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-bold">{profileFirstName(p.profile)}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  {p.team} · HCP {p.course_handicap_day}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black num leading-none">{grossTotal(p.id)}</p>
                <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                  {sfTotal(p.id)} pts
                </p>
              </div>
            </li>
          ))}
        </ul>

        {wager != null && (
          <div className="rounded-2xl border border-border p-4 mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Wager</p>
            <p className="text-lg font-black mt-1">R{wager} each</p>
            <p className="text-sm text-muted-foreground mt-1">
              {half
                ? 'Halved — stake refunded (no transfer).'
                : `${winner} win — each winner +R${wager}, each loser −R${wager}.`}
            </p>
          </div>
        )}

        {error && <p className="text-sm text-destructive mb-3">{error}</p>}

        <button
          type="button"
          disabled={busy}
          className="w-full h-12 rounded-xl text-sm font-black"
          style={{ backgroundColor: TOUR_GOLD, color: TOUR_GOLD_FG }}
          onClick={onConfirm}
        >
          {busy ? 'Confirming…' : wager != null ? 'Confirm & settle wager' : 'Confirm card'}
        </button>
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
): Pick<TourHoleScore, 'tour_player_id' | 'hole_number' | 'gross_score' | 'stableford_points' | 'net_score'>[] {
  const map = new Map<
    string,
    {
      tour_player_id: string
      hole_number: number
      gross_score: number
      stableford_points: number
      net_score: number
    }
  >()
  for (const s of scores) {
    map.set(draftKey(s.tour_player_id, s.hole_number), {
      tour_player_id: s.tour_player_id,
      hole_number: s.hole_number,
      gross_score: s.gross_score,
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
    map.set(key, {
      tour_player_id: playerId,
      hole_number: holeNumber,
      gross_score: gross,
      stableford_points: stableford,
      net_score: net,
    })
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
    <div className="flex flex-col">
      <div className="shrink-0 flex items-center justify-center py-2">
        <span
          className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          {team}
        </span>
      </div>
      <div className="flex flex-col gap-4 py-2 pb-4">
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
