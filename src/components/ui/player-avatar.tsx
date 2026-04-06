import { cn } from '@/lib/utils'
import type { Profile } from '@/lib/types'

const AVATAR_COLORS = [
  ['oklch(0.29 0.072 160)', 'oklch(0.91 0.19 106)'], // green/lime
  ['oklch(0.42 0.15 260)', 'white'],                   // blue
  ['oklch(0.50 0.21 26)', 'white'],                    // red
  ['oklch(0.55 0.12 200)', 'white'],                   // teal
  ['oklch(0.60 0.18 330)', 'white'],                   // purple
  ['oklch(0.65 0.18 50)', 'white'],                    // orange
]

function getAvatarColor(name: string): [string, string] {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

interface PlayerAvatarProps {
  player: Pick<Profile, 'display_name' | 'initials'>
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
  const [bg, text] = getAvatarColor(player.display_name)

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold flex-shrink-0',
        SIZE_CLASSES[size],
        className
      )}
      style={{ backgroundColor: bg, color: text }}
      title={player.display_name}
    >
      {player.initials}
    </div>
  )
}
