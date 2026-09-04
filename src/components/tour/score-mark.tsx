import { cn } from '@/lib/utils'

/** Classic card marks from net Stableford: rings under par, squares over. */
export function ScoreMark({
  gross,
  stableford,
  className,
}: {
  gross: number
  stableford: number | null
  className?: string
}) {
  if (gross < 1) {
    return (
      <div className={cn('relative size-12 flex items-center justify-center', className)}>
        <span className="text-2xl font-black text-muted-foreground/35">0</span>
      </div>
    )
  }

  const rings = stableford == null ? 0 : stableford >= 5 ? 3 : stableford === 4 ? 2 : stableford === 3 ? 1 : 0
  const squares = stableford == null ? 0 : stableford === 1 ? 1 : stableford === 0 ? 2 : 0

  return (
    <div className={cn('relative size-12 flex items-center justify-center', className)}>
      {rings >= 1 && <span className="absolute inset-0 rounded-full border-[2.5px] border-foreground" />}
      {rings >= 2 && <span className="absolute inset-[5px] rounded-full border-[2.5px] border-foreground" />}
      {rings >= 3 && <span className="absolute inset-[9px] rounded-full border-[2px] border-foreground" />}
      {squares >= 1 && <span className="absolute inset-0 border-[2.5px] border-foreground" />}
      {squares >= 2 && <span className="absolute inset-[5px] border-[2.5px] border-foreground" />}
      <span className="text-2xl font-black leading-none num">{gross}</span>
    </div>
  )
}
