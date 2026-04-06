import { useState } from 'react'
import { GroupStandings } from '@/components/home/group-standings'
import { BonusLeague } from '@/components/home/bonus-league'
import { ActivityFeed } from '@/components/home/activity-feed'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type StandingsTab = 'groups' | 'bonus'

export function HomePage() {
  const [tab, setTab] = useState<StandingsTab>('groups')

  return (
    <div className="space-y-5 py-4">
      {/* Standings toggle */}
      <div className="px-4">
        <div className="flex rounded-lg p-1 gap-1" style={{ backgroundColor: 'oklch(0.93 0.01 160)' }}>
          <button
            onClick={() => setTab('groups')}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all',
              tab === 'groups'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground'
            )}
          >
            Groups
          </button>
          <button
            onClick={() => setTab('bonus')}
            className={cn(
              'flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all',
              tab === 'bonus'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground'
            )}
          >
            Bonus Points
          </button>
        </div>
      </div>

      {/* Standings content */}
      {tab === 'groups' ? <GroupStandings /> : <BonusLeague />}

      <Separator />

      {/* Activity feed */}
      <ActivityFeed />
    </div>
  )
}
