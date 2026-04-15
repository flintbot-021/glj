import type { Profile } from '@/lib/types'
import { supabase } from '@/lib/supabase'

const DICEBEAR =
  'https://api.dicebear.com/7.x/notionists-neutral/svg?backgroundColor=e8f4ea&seed='

function isHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim())
}

/** Same-origin path e.g. `/avatars/p14.jpg` (Vite `public/` folder). */
function isSitePath(s: string): boolean {
  return s.trim().startsWith('/')
}

/**
 * Public URL for an object in your Supabase Storage bucket (bucket must be **public**).
 * `objectPath` is the path *inside* the bucket, e.g. `p14.jpg` or `profiles/p14.jpg`.
 */
/** Default bucket matches Supabase project storage (`profile pictures`, public). Override with VITE_SUPABASE_AVATAR_BUCKET if needed. */
export function getSupabaseStoragePublicUrl(objectPath: string): string {
  const bucket = import.meta.env.VITE_SUPABASE_AVATAR_BUCKET ?? 'profile pictures'
  const path = objectPath.replace(/^\/+/, '')
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Final image URL for `PlayerAvatar`:
 * - `https://…` → used as-is (Supabase “Copy public URL”, or any CDN).
 * - `/…` → same-origin static asset (e.g. `/avatars/p14.jpg`).
 * - anything else → object path under `VITE_SUPABASE_AVATAR_BUCKET` (e.g. `p14.jpg`).
 * - missing / empty → deterministic placeholder from nickname.
 */
export function getProfileAvatarSrc(player: Pick<Profile, 'id' | 'display_name' | 'avatar_url'>): string {
  const raw = player.avatar_url?.trim()
  if (raw) {
    if (isHttpUrl(raw)) return raw
    if (isSitePath(raw)) return raw
    return getSupabaseStoragePublicUrl(raw)
  }
  return `${DICEBEAR}${encodeURIComponent(player.display_name)}`
}
