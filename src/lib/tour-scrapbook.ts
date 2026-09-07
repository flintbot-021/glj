export type ScrapSource = 'people' | 'scene' | 'detail' | 'extra'

export interface ScrapHolePrompt {
  hole: number
  source: Exclude<ScrapSource, 'extra'>
}

/** Three holes, one in each third of the round, stable per match. */
export function scrapPromptPlan(matchId: string): ScrapHolePrompt[] {
  const h = hash(matchId)
  const front = 1 + (h % 6)
  const mid = 7 + ((h >>> 3) % 6)
  const back = 13 + ((h >>> 7) % 6)
  return [
    { hole: front, source: 'people' },
    { hole: mid, source: 'scene' },
    { hole: back, source: 'detail' },
  ]
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function storageKey(matchId: string, userId: string) {
  return `tour-scrap-prompts:${matchId}:${userId}`
}

export interface ScrapPromptState {
  doneHoles: number[]
}

export function loadScrapPromptState(matchId: string, userId: string): ScrapPromptState {
  try {
    const raw = localStorage.getItem(storageKey(matchId, userId))
    if (!raw) return { doneHoles: [] }
    const parsed = JSON.parse(raw) as { doneHoles?: number[] }
    return { doneHoles: Array.isArray(parsed.doneHoles) ? parsed.doneHoles : [] }
  } catch {
    return { doneHoles: [] }
  }
}

export function markScrapPromptDone(matchId: string, userId: string, hole: number) {
  const state = loadScrapPromptState(matchId, userId)
  if (!state.doneHoles.includes(hole)) state.doneHoles.push(hole)
  localStorage.setItem(storageKey(matchId, userId), JSON.stringify(state))
  return state
}

export function promptForHole(plan: ScrapHolePrompt[], hole: number): ScrapHolePrompt | null {
  return plan.find((p) => p.hole === hole) ?? null
}

export function scrapPromptCopy(
  _source: ScrapSource,
  hole: number | null,
  courseName?: string | null,
): { title: string; hint: string } {
  const where =
    hole != null
      ? courseName
        ? `${courseName} · hole ${hole}`
        : `Hole ${hole}`
      : courseName ?? null
  const ideas = 'It could be anything — a selfie, the scene, someone’s golf balls, a celebration.'
  return {
    title: 'Snap a photo for the scrapbook',
    hint: where ? `${where}. ${ideas}` : ideas,
  }
}
