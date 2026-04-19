import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useUIStore } from '@/stores/ui-store'
import { MatchplayForm } from './matchplay-form'
import { StrokeplayForm } from './strokeplay-form'
import { WagerMatchForm } from './wager-match-form'
import { Swords, Flag, DollarSign } from 'lucide-react'

type ScoreType = null | 'matchplay' | 'strokeplay' | 'wager'

export function ScoreEntrySheet() {
  const open = useUIStore((s) => s.scoreSheetOpen)
  const close = useUIStore((s) => s.closeScoreSheet)
  const [scoreType, setScoreType] = useState<ScoreType>(null)

  const handleClose = () => {
    close()
    setTimeout(() => setScoreType(null), 300)
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent
        side="bottom"
        className="gap-2 rounded-t-2xl px-5 pb-8 shadow-none max-h-[90dvh] overflow-y-auto"
      >
        {scoreType === null ? (
          <>
            <SheetHeader className="mb-0 px-0 pt-3 pb-1">
              <SheetTitle className="text-lg font-bold text-center">Enter Score</SheetTitle>
            </SheetHeader>
            <div className="space-y-3">
              <ScoreTypeCard
                icon={<Swords className="h-6 w-6" />}
                title="Matchplay"
                description="Record an official group fixture result"
                color="oklch(0.29 0.072 160)"
                onClick={() => setScoreType('matchplay')}
              />
              <ScoreTypeCard
                icon={<Flag className="h-6 w-6" />}
                title="Strokeplay Round"
                description="Submit a round to the bonus league"
                color="oklch(0.42 0.15 260)"
                onClick={() => setScoreType('strokeplay')}
              />
              <ScoreTypeCard
                icon={<DollarSign className="h-6 w-6" />}
                title="Wager Match"
                description="Challenge a friend to a wager"
                color="oklch(0.65 0.18 50)"
                onClick={() => setScoreType('wager')}
              />
            </div>
          </>
        ) : scoreType === 'matchplay' ? (
          <MatchplayForm onClose={handleClose} onBack={() => setScoreType(null)} />
        ) : scoreType === 'strokeplay' ? (
          <StrokeplayForm onClose={handleClose} onBack={() => setScoreType(null)} />
        ) : (
          <WagerMatchForm onClose={handleClose} onBack={() => setScoreType(null)} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function ScoreTypeCard({
  icon,
  title,
  description,
  color,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-border bg-card active:scale-[0.98] transition-transform text-left hover:border-primary/30 hover:bg-primary/5"
    >
      <div
        className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <div>
        <p className="font-bold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}
