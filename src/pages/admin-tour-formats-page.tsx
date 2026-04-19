import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
  useDeleteTourFormatMutation,
  useInsertTourFormatMutation,
  useTourFormatsCatalog,
  useUpdateTourFormatMutation,
} from '@/hooks/use-data'
import { Skeleton } from '@/components/ui/skeleton'
import { TOUR_FORMAT_PRESETS, formatHasPreset, type TourFormatPresetId } from '@/lib/tour-format-presets'
import type { TourFormat } from '@/lib/types'

export function AdminTourFormatsPage() {
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const { data: formats, isLoading } = useTourFormatsCatalog()
  const insertF = useInsertTourFormatMutation()
  const updateF = useUpdateTourFormatMutation()
  const deleteF = useDeleteTourFormatMutation()

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [rules, setRules] = useState('{}')

  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Admin Access Required</h2>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  const parseRules = (): Record<string, unknown> => {
    try {
      const o = JSON.parse(rules || '{}') as unknown
      return typeof o === 'object' && o !== null && !Array.isArray(o) ? (o as Record<string, unknown>) : {}
    } catch {
      return {}
    }
  }

  const onCreate = () => {
    insertF.mutate(
      { name: name.trim() || 'Format', description: desc, scoring_rules: parseRules() },
      {
        onSuccess: () => {
          setName('')
          setDesc('')
          setRules('{}')
        },
      }
    )
  }

  const presetAlreadyAdded = (presetId: TourFormatPresetId) =>
    formats?.some((f) => formatHasPreset(f.scoring_rules, presetId)) ?? false

  const onAddPreset = (preset: (typeof TOUR_FORMAT_PRESETS)[number]) => {
    insertF.mutate({
      name: preset.name,
      description: preset.description,
      scoring_rules: { ...preset.scoring_rules },
    })
  }

  return (
    <div className="py-4 px-4 max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tour')} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-black tracking-tight">Tour formats</h1>
          <p className="text-sm text-muted-foreground">Shared format templates (stableford rules JSON)</p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-4 mb-6 space-y-3">
            <p className="text-sm font-semibold">Preset formats</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              One-click adds a row with a standard name, description, and <code className="text-[11px]">scoring_rules</code>{' '}
              (<code className="text-[11px]">preset</code> is used to recognise the template later).
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              {TOUR_FORMAT_PRESETS.map((preset) => {
                const done = presetAlreadyAdded(preset.id)
                return (
                  <Button
                    key={preset.id}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="flex-1 h-auto py-3 flex-col items-stretch gap-1 whitespace-normal text-left"
                    disabled={insertF.isPending || done}
                    onClick={() => onAddPreset(preset)}
                  >
                    <span className="font-semibold">{preset.name}</span>
                    <span className="text-xs font-normal text-muted-foreground line-clamp-2">{preset.description}</span>
                    {done && <span className="text-[11px] text-muted-foreground">Already in list</span>}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 mb-6 space-y-3">
            <p className="text-sm font-semibold">Custom format</p>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Scoring rules (JSON object)</Label>
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={4}
                className={cn(
                  'min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm font-mono outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
                )}
              />
            </div>
            <Button onClick={onCreate} disabled={insertF.isPending} size="sm">
              {insertF.isPending ? 'Adding…' : 'Add format'}
            </Button>
          </div>

          <ul className="space-y-4">
            {formats?.map((f) => (
              <FormatCard
                key={f.id}
                format={f}
                onSave={(patch) => updateF.mutate({ id: f.id, patch })}
                onDelete={() => {
                  if (confirm('Delete this format? Ensure no tour day references it.')) deleteF.mutate(f.id)
                }}
                busy={updateF.isPending || deleteF.isPending}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function FormatCard({
  format,
  onSave,
  onDelete,
  busy,
}: {
  format: TourFormat
  onSave: (patch: { name?: string; description?: string; scoring_rules?: Record<string, unknown> }) => void
  onDelete: () => void
  busy: boolean
}) {
  const [name, setName] = useState(format.name)
  const [description, setDescription] = useState(format.description)
  const [rules, setRules] = useState(() => JSON.stringify(format.scoring_rules ?? {}, null, 2))

  return (
    <li className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="space-y-1">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Scoring rules (JSON)</Label>
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          rows={5}
          className={cn(
            'min-h-[100px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-xs font-mono outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
          )}
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={busy}
          onClick={() => {
            let scoring_rules: Record<string, unknown> = {}
            try {
              const o = JSON.parse(rules || '{}') as unknown
              scoring_rules =
                typeof o === 'object' && o !== null && !Array.isArray(o) ? (o as Record<string, unknown>) : {}
            } catch {
              alert('Invalid JSON for scoring rules')
              return
            }
            onSave({
              name: name.trim() || format.name,
              description,
              scoring_rules,
            })
          }}
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={onDelete}>
          Delete
        </Button>
      </div>
    </li>
  )
}
