import { useNavigate } from 'react-router'
import { useTourBoard } from '@/hooks/use-data'
import { Skeleton } from '@/components/ui/skeleton'
import { TourMatchCard } from '@/components/tour/tour-match-card'
import { TOUR_GOLD, TOUR_GOLD_FG } from '@/lib/tour-colors'
import { matchIsPending } from '@/lib/tour-board'
import { ChevronLeft } from 'lucide-react'

export function TourLivePage() {
  const navigate = useNavigate()
  const { data: board, isLoading } = useTourBoard()

  return (
    <div className="py-4 pb-8">
      <div className="px-4 mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/tour')}
          className="size-8 rounded-full flex items-center justify-center text-muted-foreground active:bg-muted"
          aria-label="Back"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-black">Live scoring</h1>
          <p className="text-sm text-muted-foreground">Pick a match to enter or watch</p>
        </div>
      </div>

      <div className="px-4 space-y-5">
        {isLoading || !board ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : board.days.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tour days yet.</p>
        ) : (
          board.days.map((d) => (
            <section key={d.day.id}>
              <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">
                Day {d.day.day_number} · {d.format.name}
              </h2>
              {d.matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No matches lined up.</p>
              ) : (
                <div className="space-y-2">
                  {d.matches.map((m) => (
                    <TourMatchCard key={m.match.id} view={m}>
                      {!matchIsPending(m) && (
                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            className="h-11 rounded-xl text-sm font-bold border border-border bg-background"
                            onClick={() => navigate(`/tour/scoring/${m.match.id}?mode=view`)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="h-11 rounded-xl text-sm font-black"
                            style={{ backgroundColor: TOUR_GOLD, color: TOUR_GOLD_FG }}
                            onClick={() => navigate(`/tour/scoring/${m.match.id}`)}
                          >
                            Score
                          </button>
                        </div>
                      )}
                    </TourMatchCard>
                  ))}
                </div>
              )}
            </section>
          ))
        )}
      </div>
    </div>
  )
}
