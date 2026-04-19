import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'
import { getProfileAvatarSrc } from '@/lib/avatar-src'
import { profileDisplayName } from '@/lib/format'

const AVATAR_COLORS = [
  ['oklch(0.22 0.068 157)', 'oklch(0.80 0.14 72)'], // green/lime
  ['oklch(0.42 0.15 260)', 'white'], // blue
  ['oklch(0.50 0.21 26)', 'white'], // red
  ['oklch(0.55 0.12 200)', 'white'], // teal
  ['oklch(0.60 0.18 330)', 'white'], // purple
  ['oklch(0.65 0.18 50)', 'white'], // orange
]

function getAvatarColor(name: string): [string, string] {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index] as [string, string]
}

interface PlayerAvatarProps {
  player: Pick<Profile, 'display_name' | 'initials' | 'id' | 'avatar_url' | 'full_name'>
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_CLASSES = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
}

export function PlayerAvatar({ player, size = 'md', className }: PlayerAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const label = profileDisplayName(player)
  const [bg, text] = getAvatarColor(label)
  const src = getProfileAvatarSrc(player)
  const showImg = !imgFailed

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold flex-shrink-0 overflow-hidden',
        SIZE_CLASSES[size],
        className
      )}
      style={showImg ? undefined : { backgroundColor: bg, color: text }}
      title={label}
    >
      {showImg ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        player.initials
      )}
    </div>
  )
}
