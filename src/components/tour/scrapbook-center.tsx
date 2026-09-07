import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { TourScrapbook } from '@/components/tour/tour-scrapbook'
import { ScrapCaptureSheet } from '@/components/tour/scrap-capture-sheet'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import {
  useDeleteTourScrapbook,
  useSaveTourScrapbook,
  useTourDays,
  useTourEvent,
  useTourScrapbook,
} from '@/hooks/use-data'
import { TOUR_GOLD, TOUR_GOLD_FG, TOUR_GREEN } from '@/lib/tour-colors'
import { canSeeTour } from '@/lib/tour-preview'

export function ScrapbookCenter() {
  const open = useUIStore((s) => s.scrapbookOpen)
  const close = useUIStore((s) => s.closeScrapbook)
  const profile = useAuthStore((s) => s.profile)
  const allowed = canSeeTour(profile?.email)
  const { data: ev } = useTourEvent()
  const { data: days = [] } = useTourDays()
  const scrap = useTourScrapbook(allowed ? ev?.id : undefined)
  const saveScrap = useSaveTourScrapbook()
  const delScrap = useDeleteTourScrapbook()
  const [adding, setAdding] = useState(false)
  const [scrapError, setScrapError] = useState('')

  if (!open || !allowed) return null

  const courses = new Map(
    days.flatMap((d) => (d.course ? [[d.course.id, d.course.name] as const] : [])),
  )
  const extraDay = [...days].reverse().find((d) => d.course) ?? days[0]

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col"
      style={{ backgroundColor: TOUR_GREEN, paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="shrink-0 px-3 pt-2 pb-3 flex items-center gap-2">
        <button
          type="button"
          className="size-9 rounded-full flex items-center justify-center text-white/70"
          onClick={close}
          aria-label="Close scrapbook"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Tour memories</p>
          <h1 className="rtd-display text-2xl text-white leading-none tracking-wide">Scrapbook</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setScrapError('')
            setAdding(true)
          }}
          className="size-11 rounded-full flex items-center justify-center"
          style={{ backgroundColor: TOUR_GOLD, color: TOUR_GOLD_FG }}
          aria-label="Add polaroid"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {!ev ? (
          <p className="px-6 pt-16 text-center text-sm text-white/55">Tour isn’t set up yet.</p>
        ) : (
          <TourScrapbook
            entries={scrap.data?.entries ?? []}
            courses={courses}
            authors={scrap.data?.authors ?? new Map()}
            myId={profile?.id}
            onAdd={() => {
              setScrapError('')
              setAdding(true)
            }}
            onDelete={(entry) => {
              if (!window.confirm('Remove this polaroid?')) return
              delScrap.mutate({ id: entry.id, photoPath: entry.photo_path })
            }}
          />
        )}
      </div>

      {profile && ev ? (
        <ScrapCaptureSheet
          open={adding}
          source="extra"
          hole={null}
          courseName={extraDay?.course?.name}
          busy={saveScrap.isPending}
          error={scrapError}
          allowLibrary
          dismissLabel="Close"
          onSkip={() => {
            setAdding(false)
            setScrapError('')
          }}
          onSubmit={(blob, caption) => {
            setScrapError('')
            saveScrap.mutate(
              {
                userId: profile.id,
                blob,
                tour_id: ev.id,
                match_id: null,
                course_id: extraDay?.course?.id ?? null,
                day_number: extraDay ? (extraDay.day_number as 1 | 2 | 3) : null,
                hole_number: null,
                caption,
                source: 'extra',
                created_by: profile.id,
              },
              {
                onSuccess: () => setAdding(false),
                onError: (e) =>
                  setScrapError(e instanceof Error ? e.message : 'Could not save that snap'),
              },
            )
          }}
        />
      ) : null}
    </div>
  )
}
