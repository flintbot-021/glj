import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, RotateCcw } from 'lucide-react'
import { compressTourPhoto } from '@/lib/compress-photo'
import { scrapPromptCopy, type ScrapSource } from '@/lib/tour-scrapbook'
import { TOUR_GOLD, TOUR_GOLD_FG, TOUR_GREEN } from '@/lib/tour-colors'
import { cn } from '@/lib/utils'

export function ScrapCaptureSheet({
  open,
  source,
  hole,
  courseName,
  busy,
  error,
  onSkip,
  onSubmit,
  tone = 'page',
  allowLibrary = false,
  dismissLabel = 'Skip',
  startWith = 'camera',
}: {
  open: boolean
  source: ScrapSource
  hole: number | null
  courseName?: string | null
  busy?: boolean
  error?: string
  onSkip: () => void
  onSubmit: (file: Blob, caption: string) => void
  tone?: 'page' | 'score'
  allowLibrary?: boolean
  dismissLabel?: string
  startWith?: 'camera' | 'library'
}) {
  const camRef = useRef<HTMLInputElement>(null)
  const libRef = useRef<HTMLInputElement>(null)
  const lastPicker = useRef<'camera' | 'library'>(startWith)
  const [preview, setPreview] = useState<string | null>(null)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [caption, setCaption] = useState('')
  const [localError, setLocalError] = useState('')
  const copy = scrapPromptCopy(source, hole, courseName)

  useEffect(() => {
    if (!open) return
    lastPicker.current = startWith
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setBlob(null)
    setCaption('')
    setLocalError('')
    const t = window.setTimeout(() => {
      if (startWith === 'library') libRef.current?.click()
    }, 50)
    return () => window.clearTimeout(t)
  }, [open, source, hole, startWith])

  if (!open) return null

  const onFile = async (file: File | undefined, picker: 'camera' | 'library') => {
    if (!file) return
    lastPicker.current = picker
    setLocalError('')
    try {
      const compressed = await compressTourPhoto(file)
      setBlob(compressed)
      const url = URL.createObjectURL(compressed)
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
    } catch {
      setLocalError('Could not read that photo. Try another.')
    }
  }

  const submit = () => {
    if (!blob) return
    onSubmit(blob, caption.trim())
  }

  const retake = () => {
    if (lastPicker.current === 'library') libRef.current?.click()
    else camRef.current?.click()
  }

  const goldBtn = { backgroundColor: TOUR_GOLD, color: TOUR_GOLD_FG }
  const ghostBtn = cn(
    'h-24 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold text-sm border',
    tone === 'score' ? 'border-white/20 text-white/80' : 'border-border bg-card',
  )

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={dismissLabel}
        onClick={onSkip}
      />
      <div
        className={cn(
          'relative w-full max-w-md rounded-t-3xl px-4 pt-4 pb-6',
          tone === 'score' ? 'text-white' : 'bg-background',
        )}
        style={
          tone === 'score'
            ? { backgroundColor: TOUR_GREEN, paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }
            : { paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }
        }
      >
        <p className={cn('text-xs font-bold uppercase tracking-widest', tone === 'score' ? 'text-white/50' : 'text-muted-foreground')}>
          Scrapbook
        </p>
        <h2 className={cn('text-2xl font-black mt-1', tone === 'score' && 'text-white')}>{copy.title}</h2>
        <p className={cn('text-sm mt-1', tone === 'score' ? 'text-white/60' : 'text-muted-foreground')}>
          {copy.hint}
        </p>

        <input
          ref={camRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0], 'camera')}
        />
        <input
          ref={libRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0], 'library')}
        />

        {preview ? (
          <div className="mt-4 relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full aspect-[4/3] object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={retake}
              className="absolute top-2 right-2 h-9 px-3 rounded-full text-xs font-black flex items-center gap-1"
              style={goldBtn}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retake
            </button>
          </div>
        ) : allowLibrary ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => camRef.current?.click()}
              className="h-24 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold text-sm"
              style={goldBtn}
            >
              <Camera className="h-5 w-5" />
              Take another
            </button>
            <button type="button" onClick={() => libRef.current?.click()} className={ghostBtn}>
              <ImagePlus className="h-5 w-5" />
              Upload more
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => camRef.current?.click()}
            className="mt-4 w-full h-28 rounded-2xl flex flex-col items-center justify-center gap-1 font-bold"
            style={goldBtn}
          >
            <Camera className="h-6 w-6" />
            Snap a photo
          </button>
        )}

        {preview ? (
          <label className="mt-3 block">
            <span className={cn('text-[11px] font-bold uppercase tracking-wider', tone === 'score' ? 'text-white/45' : 'text-muted-foreground')}>
              Caption
            </span>
            <input
              value={caption}
              maxLength={80}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What happened here?"
              className={cn(
                'mt-1 w-full h-11 rounded-xl px-3 text-sm font-semibold outline-none',
                tone === 'score' ? 'bg-white/10 text-white placeholder:text-white/35' : 'bg-muted',
              )}
            />
          </label>
        ) : null}

        {(error || localError) ? (
          <p className="text-sm text-red-300 mt-2">{error || localError}</p>
        ) : null}

        {preview ? (
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="mt-4 w-full h-12 rounded-xl text-sm font-black disabled:opacity-50"
            style={goldBtn}
          >
            {busy ? 'Saving…' : 'Add to scrapbook'}
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={onSkip}
          className={cn(
            'mt-2 w-full h-11 rounded-xl text-sm font-bold',
            tone === 'score' ? 'text-white/60' : 'text-muted-foreground',
          )}
        >
          {dismissLabel}
        </button>
      </div>
    </div>
  )
}
