import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { useSubSeasons, useBonusLeague } from '@/hooks/use-data'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { formatDate, formatPoints } from '@/lib/format'
import { BONUS_POINT_AWARDS } from '@/lib/mock-data'

export function AdminSubSeasonsPage() {
  const navigate = useNavigate()
  const { data: subSeasons } = useSubSeasons()
  const { data: bonusLeague } = useBonusLeague()

  return (
    <div className="py-4">
      <div className="px-4 mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-black">Sub-Seasons</h1>
      </div>

      <div className="px-4 space-y-4">
        {subSeasons?.map((ss) => (
          <Card key={ss.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">{ss.name}</CardTitle>
                <Badge
                  className={`text-xs font-bold border-0 ${
                    ss.status === 'open'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {ss.status === 'open' ? 'OPEN' : 'CLOSED'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(ss.start_date)} — {formatDate(ss.end_date)}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>1st: +{ss.bonus_1st}pts</span>
                <span>2nd: +{ss.bonus_2nd}pts</span>
                <span>3rd: +{ss.bonus_3rd}pts</span>
              </div>

              {ss.status === 'closed' && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Bonus Awards</p>
                  {BONUS_POINT_AWARDS.filter((a) => a.sub_season_id === ss.id).map((award) => {
                    const entry = bonusLeague?.find((e) => e.player.id === award.player_id)
                    if (!entry) return null
                    return (
                      <div key={award.id} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">#{award.position}</span>
                        <PlayerAvatar player={entry.player} size="xs" />
                        <span className="text-sm flex-1">{entry.player.display_name}</span>
                        <span className="text-sm font-bold" style={{ color: 'oklch(0.91 0.19 106)' }}>
                          +{formatPoints(award.points_awarded)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {ss.status === 'open' ? (
                  <Button size="sm" variant="destructive" className="flex-1">
                    Close Sub-Season
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="flex-1" disabled>
                    Reopening unavailable
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
