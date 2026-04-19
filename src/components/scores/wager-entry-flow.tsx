import { useState } from 'react'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Users, User } from 'lucide-react'
import { WagerMatchForm } from '@/components/scores/wager-match-form'
import { TeamWagerForm } from '@/components/wagers/team-wager-form'
import { OpenWagersSection } from '@/components/scores/open-wagers-section'
import { cn } from '@/lib/utils'

type Mode = 'hub' | 'new1v1' | 'newTeam'

interface Props {
  onClose: () => void
  onBack: () => void
}

export function WagerEntryFlow({ onClose, onBack }: Props) {
  const [mode, setMode] = useState<Mode>('hub')

  if (mode === 'new1v1') {
    return <WagerMatchForm onClose={onClose} onBack={() => setMode('hub')} />
  }
  if (mode === 'newTeam') {
    return <TeamWagerForm onClose={onClose} onBack={() => setMode('hub')} />
  }

  return (
    <OpenWagersSection onNavigateAway={onClose}>
      {(openWagersList) => (
        <>
          <SheetHeader className="mb-0 px-0 pt-3 pb-2">
            <div className="relative flex h-11 items-center justify-center pr-10">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="absolute left-0 top-1/2 h-8 w-8 -translate-y-1/2"
                aria-label="Back"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <SheetTitle className="text-lg font-bold">Wagers</SheetTitle>
            </div>
          </SheetHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Open an active wager to record or confirm a result, or start a new 1v1 or 2v2 challenge.
            </p>
            {openWagersList}
            <div className="grid gap-2">
              <Button
                type="button"
                className={cn('h-12 justify-start gap-2 rounded-xl font-semibold')}
                style={{ backgroundColor: 'oklch(0.65 0.18 50)', color: 'white' }}
                onClick={() => setMode('new1v1')}
              >
                <User className="h-4 w-4" />
                New 1v1 wager
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 justify-start gap-2 rounded-xl border-2 font-semibold"
                onClick={() => setMode('newTeam')}
              >
                <Users className="h-4 w-4" />
                New 2v2 team wager
              </Button>
            </div>
          </div>
        </>
      )}
    </OpenWagersSection>
  )
}
