import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useTourDayMatches, useTourHolesForCourse, useTourHoleScores, useSaveTourHoleScore } from '@/hooks/use-data'
import { useTourDays } from '@/hooks/use-data'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { profileDisplayName } from '@/lib/format'
import { computeTourHoleScore } from '@/lib/scoring'
import type { TourTeam } from '@/lib/types'

export function TourScoringPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const [currentHole, setCurrentHole] = useState(1)

  const { data: holeScores = [] } = useTourHoleScores(matchId ?? '')
  const saveScore = useSaveTourHoleScore()
  const { data: tourDays = [] } = useTourDays()

  const dayMatches = [1, 2, 3]
    .map((n) => tourDays.find((d) => d.day_number === n)?.id)
    .filter((id): id is string => Boolean(id))

  const { data: d1Matches = [] } = useTourDayMatches(dayMatches[0] ?? '')
  const { data: d2Matches = [] } = useTourDayMatches(dayMatches[1] ?? '')
  const { data: d3Matches = [] } = useTourDayMatches(dayMatches[2] ?? '')
  const allMatches = [...d1Matches, ...d2Matches, ...d3Matches]
  const match = allMatches.find((m) => m.id === matchId)

  const courseId = match?.day.course_id
  const { data: holes = [] } = useTourHolesForCourse(courseId)

  const hole = holes.find((h) => h.hole_number === currentHole)

  const allPlayers = match ? [...match.players_a, ...match.players_b] : []

  const [scores, setScores] = useState<Record<string, number>>({})

  const getExistingScore = (playerId: string, holeNum: number) =>
    holeScores.find((s) => s.tour_player_id === playerId && s.hole_number === holeNum)?.gross_score ?? 0

  const handleIncrement = (playerId: string, delta: number) => {
    const current = scores[`${playerId}-${currentHole}`] ?? getExistingScore(playerId, currentHole)
    const newVal = Math.max(1, current + delta)
    setScores((prev) => ({ ...prev, [`${playerId}-${currentHole}`]: newVal }))
  }

  const handleSaveHole = async () => {
    if (!hole || !match) return
    const savePromises = allPlayers.map((p) => {
      const gross = scores[`${p.id}-${currentHole}`] ?? getExistingScore(p.id, currentHole)
      if (!gross) return null
      const { net, stableford } = computeTourHoleScore(gross, hole, p.course_handicap_day)
      return saveScore.mutateAsync({
        match_id: matchId!,
        tour_player_id: p.id,
        hole_number: currentHole,
        gross_score: gross,
        net_score: net,
        stableford_points: stableford,
      })
    }).filter(Boolean)

    await Promise.all(savePromises)
    if (currentHole < 18) setCurrentHole((h) => h + 1)
  }

  if (!match || !hole) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading match...</p>
      </div>
    )
  }

  const teamColor = (team: TourTeam) =>
    team === '93s' ? 'oklch(0.42 0.15 260)' : 'oklch(0.50 0.21 26)'

  return (
    <div className="min-h-dvh flex flex-col" style={{ backgroundColor: 'oklch(0.29 0.072 160)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-white/70 text-sm font-medium">{match.format?.name ?? 'Scoring'}</span>
        <span className="text-white/40 text-sm">{currentHole}/18</span>
      </div>

      {/* Hole info */}
      <div className="text-center py-6">
        <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1">Hole</p>
        <p className="text-7xl font-black text-white leading-none">{currentHole}</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="text-white/60 text-sm">Par {hole.par}</span>
          <span className="text-white/30">·</span>
          <span className="text-white/60 text-sm">SI {hole.stroke_index}</span>
        </div>
      </div>

      {/* Hole navigation dots */}
      <div className="flex justify-center gap-1 mb-4 px-4">
        {Array.from({ length: 18 }, (_, i) => {
          const hasScores = allPlayers.some((p) =>
            holeScores.some((s) => s.tour_player_id === p.id && s.hole_number === i + 1)
          )
          return (
            <button
              key={i}
              onClick={() => setCurrentHole(i + 1)}
              className="rounded-full transition-all"
              style={{
                height: 6,
                width: currentHole === i + 1 ? 16 : 6,
                backgroundColor: currentHole === i + 1
                  ? 'oklch(0.91 0.19 106)'
                  : hasScores ? 'oklch(0.50 0.06 160)' : 'oklch(0.40 0.05 160)',
              }}
            />
          )
        })}
      </div>

      {/* Score inputs */}
      <div className="flex-1 bg-background rounded-t-3xl px-4 pt-6 pb-4">
        <div className="space-y-4">
          {allPlayers.map((player) => {
            const teamCol = teamColor(player.team)
            const currentScore = scores[`${player.id}-${currentHole}`] ?? getExistingScore(player.id, currentHole)
            const previewScore = currentScore && hole
              ? computeTourHoleScore(currentScore, hole, player.course_handicap_day)
              : null

            return (
              <div key={player.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-black px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: teamCol }}
                    >
                      {player.team}
                    </span>
                    <span className="font-bold text-sm">{profileDisplayName(player.profile)}</span>
                    <span className="text-xs text-muted-foreground">CH {player.course_handicap_day}</span>
                  </div>
                  {previewScore && (
                    <div className="text-right">
                      <span
                        className="text-sm font-black"
                        style={{ color: 'oklch(0.42 0.15 260)' }}
                      >
                        {previewScore.stableford} pts
                      </span>
                    </div>
                  )}
                </div>

                {/* Score stepper */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    className="h-14 w-14 rounded-xl text-xl font-black border-2"
                    onClick={() => handleIncrement(player.id, -1)}
                  >
                    −
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-4xl font-black">
                      {currentScore || '—'}
                    </span>
                    {currentScore && hole && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {currentScore === hole.par ? 'Par'
                          : currentScore < hole.par ? `${hole.par - currentScore} under`
                          : `${currentScore - hole.par} over`}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="h-14 w-14 rounded-xl text-xl font-black border-2"
                    onClick={() => handleIncrement(player.id, 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Save + next */}
        <div className="flex gap-3 mt-6">
          {currentHole > 1 && (
            <Button
              variant="outline"
              className="h-14 w-14 flex-shrink-0"
              onClick={() => setCurrentHole((h) => h - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <Button
            className="flex-1 h-14 text-base font-bold gap-2"
            style={{ backgroundColor: 'oklch(0.91 0.19 106)', color: 'oklch(0.20 0.07 150)' }}
            onClick={handleSaveHole}
            disabled={saveScore.isPending}
          >
            {saveScore.isPending ? 'Saving...' : currentHole === 18 ? 'Finish Round' : 'Save & Next'}
            {currentHole < 18 && <ChevronRight className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
