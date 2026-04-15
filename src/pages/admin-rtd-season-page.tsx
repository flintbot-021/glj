import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { useActiveSeason, useSubSeasons, useUpdateSeason, useUpdateSubSeason } from '@/hooks/use-data'
import { formatDate } from '@/lib/format'
import type { SubSeason } from '@/lib/types'

export function AdminRtdSeasonPage() {
  const navigate = useNavigate()
  const { data: season } = useActiveSeason()
  const { data: subSeasons } = useSubSeasons()
  const updateSeason = useUpdateSeason()
  const updateSub = useUpdateSubSeason()

  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  useEffect(() => {
    if (!season) return
    setName(season.name)
    setYear(String(season.year))
    setStart(season.start_date ?? '')
    setEnd(season.end_date ?? '')
  }, [season])

  if (!season) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">No active season found.</p>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="px-4 mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/rtd')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black">Season &amp; bonus legs</h1>
          <p className="text-sm text-muted-foreground">RTD season window and three stroke-play legs</p>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Main season</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="sn">Name</Label>
              <Input id="sn" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sy">Year</Label>
              <Input id="sy" type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ss">Start</Label>
                <Input id="ss" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="se">End</Label>
                <Input id="se" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
            <Button
              size="sm"
              disabled={updateSeason.isPending}
              onClick={() =>
                updateSeason.mutate({
                  seasonId: season.id,
                  patch: {
                    name: name.trim(),
                    year: Number.parseInt(year, 10),
                    start_date: start || undefined,
                    end_date: end || undefined,
                  },
                })
              }
            >
              {updateSeason.isPending ? 'Saving…' : 'Save season'}
            </Button>
          </CardContent>
        </Card>

        {subSeasons?.map((ss) => (
          <SubSeasonCard
            key={ss.id}
            sub={ss}
            onSave={(patch) => updateSub.mutate({ subSeasonId: ss.id, patch })}
            loading={updateSub.isPending}
          />
        ))}
      </div>
    </div>
  )
}

function SubSeasonCard({
  sub,
  onSave,
  loading,
}: {
  sub: SubSeason
  onSave: (patch: {
    name?: string
    start_date?: string
    end_date?: string
    bonus_1st?: number
    bonus_2nd?: number
    bonus_3rd?: number
  }) => void
  loading: boolean
}) {
  const [name, setName] = useState(sub.name)
  const [start, setStart] = useState(sub.start_date.slice(0, 10))
  const [end, setEnd] = useState(sub.end_date.slice(0, 10))
  const [b1, setB1] = useState(String(sub.bonus_1st))
  const [b2, setB2] = useState(String(sub.bonus_2nd))
  const [b3, setB3] = useState(String(sub.bonus_3rd))

  useEffect(() => {
    setName(sub.name)
    setStart(sub.start_date.slice(0, 10))
    setEnd(sub.end_date.slice(0, 10))
    setB1(String(sub.bonus_1st))
    setB2(String(sub.bonus_2nd))
    setB3(String(sub.bonus_3rd))
  }, [sub])

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{sub.name}</CardTitle>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            sub.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'
          }`}
        >
          {sub.status.toUpperCase()}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Display: {formatDate(sub.start_date)} — {formatDate(sub.end_date)}
        </p>
        <div className="space-y-1.5">
          <Label>Leg name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Start</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label className="text-[10px]">1st pts</Label>
            <Input value={b1} onChange={(e) => setB1(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">2nd pts</Label>
            <Input value={b2} onChange={(e) => setB2(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">3rd pts</Label>
            <Input value={b3} onChange={(e) => setB3(e.target.value)} />
          </div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          disabled={loading}
          onClick={() =>
            onSave({
              name: name.trim(),
              start_date: start,
              end_date: end,
              bonus_1st: Number.parseFloat(b1),
              bonus_2nd: Number.parseFloat(b2),
              bonus_3rd: Number.parseFloat(b3),
            })
          }
        >
          {loading ? 'Saving…' : 'Save leg'}
        </Button>
      </CardContent>
    </Card>
  )
}
