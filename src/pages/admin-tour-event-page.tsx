import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useInsertTourEvent, useTourEvent, useUpdateTourEvent } from '@/hooks/use-data'
import type { TourStatus } from '@/lib/types'

export function AdminTourEventPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const { data: ev, isLoading } = useTourEvent()
  const insertEv = useInsertTourEvent()
  const updateEv = useUpdateTourEvent()

  const [name, setName] = useState('')
  const [status, setStatus] = useState<TourStatus>('setup')
  const [target, setTarget] = useState('8.5')

  useEffect(() => {
    if (ev) {
      setName(ev.name)
      setStatus(ev.status)
      setTarget(String(ev.target_points))
    }
  }, [ev])

  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  const onCreate = () => {
    insertEv.mutate(
      {
        name: name.trim() || 'Tour',
        status: 'setup',
        target_points: Number(target) || 8.5,
      },
      {
        onSuccess: () => navigate('/admin/tour'),
      }
    )
  }

  const onSave = () => {
    if (!ev) return
    updateEv.mutate({
      id: ev.id,
      patch: {
        name: name.trim() || ev.name,
        status,
        target_points: Number(target) || ev.target_points,
      },
    })
  }

  return (
    <div className="py-4 px-4 max-w-lg">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tour')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black tracking-tight">Tour event</h1>
          <p className="text-sm text-muted-foreground">Name, status, first-to target</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !ev ? (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">No tour row yet. Create one to attach roster, courses, and days.</p>
          <div className="space-y-2">
            <Label htmlFor="tname">Name</Label>
            <Input id="tname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Adare Manor 2026" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ttarget">Target points (team race)</Label>
            <Input id="ttarget" value={target} onChange={(e) => setTarget(e.target.value)} inputMode="decimal" />
          </div>
          <Button onClick={onCreate} disabled={insertEv.isPending}>
            {insertEv.isPending ? 'Creating…' : 'Create tour'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TourStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="setup">Setup</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tgt">Target points</Label>
            <Input id="tgt" value={target} onChange={(e) => setTarget(e.target.value)} inputMode="decimal" />
          </div>
          <Button onClick={onSave} disabled={updateEv.isPending}>
            {updateEv.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )}
    </div>
  )
}
