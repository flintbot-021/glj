# Profile photos

## Supabase (production)

Project uses the **public** bucket **`profile pictures`** with files such as `kev.jpg`, `duane.jpg`, `sean.png`, etc.

- `profiles.avatar_url` in the database holds the **object name** only (e.g. `kev.jpg`).  
- The app builds the public URL via `getSupabaseStoragePublicUrl()` and `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.

Optional: set `VITE_SUPABASE_AVATAR_BUCKET="profile pictures"` in `.env.local` if you rename the bucket (default in code is already `profile pictures`).

## Local `/public/avatars`

You can use site paths like `/avatars/p14.jpg` in `avatar_url` instead of Storage.
