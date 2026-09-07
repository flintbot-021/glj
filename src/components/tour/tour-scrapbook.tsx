import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Polaroid } from '@/components/tour/polaroid'
import { profileFirstName } from '@/lib/format'
import type { Profile } from '@/lib/types'
import type { TourScrapbookEntry } from '@/lib/types'

function hash(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function scatter(id: string, index: number, width: number) {
  const h = hash(id)
  const col = index % 3
  const row = Math.floor(index / 3)
  const cell = Math.max(110, (width - 24) / 3)
  const x = 8 + col * cell + (h % 28) - 10
  const y = 12 + row * 148 + ((h >>> 5) % 36) - 8
  const rotate = ((h >>> 11) % 17) - 8
  return { x, y, rotate }
}

export function TourScrapbook({
  entries,
  courses,
  authors,
  myId,
  onAdd,
  onDelete,
}: {
  entries: TourScrapbookEntry[]
  courses: Map<string, string>
  authors: Map<string, Profile>
  myId?: string
  onAdd: () => void
  onDelete?: (entry: TourScrapbookEntry) => void
}) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [front, setFront] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const [width, setWidth] = useState(360)

  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth || 360)
    measure()
    const obs = new ResizeObserver(measure)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  const rows = Math.max(1, Math.ceil(entries.length / 3))
  const boardH = Math.max(420, 40 + rows * 160)
  const focusEntry = entries.find((e) => e.id === focused) ?? null
  const focusIndex = focusEntry ? entries.findIndex((e) => e.id === focusEntry.id) : -1
  const placed = useMemo(
    () => entries.map((entry, i) => ({ entry, ...scatter(entry.id, i, width) })),
    [entries, width],
  )

  return (
    <div className="relative h-full min-h-0 flex flex-col">
      <div
        ref={boardRef}
        className="relative flex-1 min-h-0 overflow-auto"
        style={{
          backgroundColor: 'oklch(0.28 0.05 145)',
          backgroundImage:
            'radial-gradient(oklch(1 0 0 / 0.07) 0.8px, transparent 0.8px), repeating-linear-gradient(125deg, oklch(0.32 0.05 80 / 0.18) 0 2px, transparent 2px 11px)',
          backgroundSize: '10px 10px, auto',
        }}
      >
        <div className="relative" style={{ height: boardH, minHeight: '100%' }}>
          {entries.length === 0 ? (
            <button
              type="button"
              onClick={onAdd}
              className="absolute left-1/2 top-[28%] w-44 -translate-x-1/2 -rotate-2 bg-white p-2 pb-3 text-left shadow-lg"
              style={{ backgroundColor: 'oklch(0.97 0.01 90)' }}
            >
              <div className="h-32 border border-dashed border-black/20 flex items-center justify-center text-center px-3">
                <p className="text-xs font-bold text-black/40">Drop the first polaroid on the table</p>
              </div>
              <p className="mt-2 text-[11px] font-bold px-0.5" style={{ color: 'oklch(0.22 0.068 157)' }}>
                Tap to add
              </p>
            </button>
          ) : (
            placed.map(({ entry, x, y, rotate }, i) => (
              <motion.div
                key={entry.id}
                drag
                dragConstraints={boardRef}
                dragElastic={0.18}
                dragMomentum
                whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
                onPointerDown={() => setFront(entry.id)}
                onTap={() => setFocused(entry.id)}
                initial={{ x, y, rotate, opacity: 0, scale: 0.82 }}
                animate={{ opacity: 1, scale: 1, rotate }}
                transition={{ type: 'spring', stiffness: 380, damping: 24, delay: Math.min(i, 8) * 0.04 }}
                className="absolute cursor-grab active:cursor-grabbing"
                style={{
                  zIndex: front === entry.id ? 40 : i + 1,
                  filter: 'drop-shadow(0 10px 14px rgb(0 0 0 / 0.28))',
                }}
              >
                <Polaroid
                  entry={entry}
                  courseName={entry.course_id ? courses.get(entry.course_id) : null}
                  authorName={
                    authors.get(entry.created_by)
                      ? profileFirstName(authors.get(entry.created_by)!)
                      : undefined
                  }
                />
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {focusEntry ? (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/75"
              aria-label="Close"
              onClick={() => setFocused(null)}
            />
            <motion.div
              className="relative z-10 w-full max-w-sm"
              initial={{ scale: 0.86, rotate: scatter(focusEntry.id, 0, 360).rotate }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            >
              <Polaroid
                entry={focusEntry}
                courseName={focusEntry.course_id ? courses.get(focusEntry.course_id) : null}
                authorName={
                  authors.get(focusEntry.created_by)
                    ? profileFirstName(authors.get(focusEntry.created_by)!)
                    : undefined
                }
                large
                className="mx-auto"
              />
              <div className="flex items-center justify-between mt-5">
                <button
                  type="button"
                  className="text-white/80 text-sm font-bold disabled:opacity-30"
                  disabled={focusIndex <= 0}
                  onClick={() => setFocused(entries[focusIndex - 1]!.id)}
                >
                  Previous
                </button>
                {myId === focusEntry.created_by && onDelete ? (
                  <button
                    type="button"
                    className="text-red-300 text-sm font-bold"
                    onClick={() => {
                      onDelete(focusEntry)
                      setFocused(null)
                    }}
                  >
                    Remove
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  className="text-white/80 text-sm font-bold disabled:opacity-30"
                  disabled={focusIndex < 0 || focusIndex >= entries.length - 1}
                  onClick={() => setFocused(entries[focusIndex + 1]!.id)}
                >
                  Next
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <p className="shrink-0 px-4 py-2 text-center text-[11px] font-semibold text-white/45">
        {entries.length === 0
          ? 'Live snaps from the round land here'
          : 'Drag the polaroids around · tap one to open'}
      </p>
    </div>
  )
}
