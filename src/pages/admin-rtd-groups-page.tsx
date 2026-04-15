import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft } from 'lucide-react'
import { useActiveSeason, useGroupsWithMembers, useSetPlayerGroup } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { profileDisplayName } from '@/lib/format'
import type { Profile } from '@/lib/types'

export function AdminRtdGroupsPage() {
  const navigate = useNavigate()
  const { data: season } = useActiveSeason()
  const { data: groups, isLoading } = useGroupsWithMembers()
  const move = useSetPlayerGroup()
  const [busyId, setBusyId] = useState<string | null>(null)

  const allGroups = groups?.map((g) => g.group) ?? []

  const findGroupIdForPlayer = (playerId: string) => {
    const row = groups?.find((g) => g.players.some((p) => p.id === playerId))
    return row?.group.id
  }

  const onMove = (player: Profile, newGroupId: string) => {
    const current = findGroupIdForPlayer(player.id)
    if (!season || !current || newGroupId === current) return
    setBusyId(player.id)
    move.mutate(
      { seasonId: season.id, playerId: player.id, groupId: newGroupId },
      { onSettled: () => setBusyId(null) }
    )
  }

  return (
    <div className="py-4">
      <div className="px-4 mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/rtd')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black">Groups</h1>
          <p className="text-sm text-muted-foreground">Match-play groups for the active season</p>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {isLoading || !season ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : (
          groups?.map(({ group, players }) => (
            <div key={group.id} className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">{group.name}</h2>
              <ul className="space-y-3">
                {players.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 flex-wrap">
                    <PlayerAvatar player={p} size="sm" />
                    <div className="flex-1 min-w-[120px]">
                      <span className="text-sm font-medium">{profileDisplayName(p)}</span>
                      <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    </div>
                    <div className="w-full sm:w-48">
                      <Select
                        value={group.id}
                        onValueChange={(v) => v && onMove(p, v)}
                        disabled={move.isPending && busyId === p.id}
                      >
                        <SelectTrigger size="sm" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allGroups.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
