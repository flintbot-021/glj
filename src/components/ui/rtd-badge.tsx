interface Props {
  size?: number
  color?: string
  className?: string
}

/**
 * RTD shield crest — Road To Dias badge.
 * Uses currentColor so wrap in a container with the desired text colour,
 * or pass the `color` prop directly.
 */
export function RTDBadge({ size = 72, color = 'oklch(0.80 0.14 72)', className }: Props) {
  return (
    <svg
      viewBox="0 0 80 96"
      width={size}
      height={size * 1.2}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Shield fill — very subtle tint */}
      <path
        d="M40 4 L75 19 L75 58 Q75 84 40 95 Q5 84 5 58 L5 19 Z"
        fill={color}
        opacity="0.10"
      />

      {/* Outer shield stroke */}
      <path
        d="M40 4 L75 19 L75 58 Q75 84 40 95 Q5 84 5 58 L5 19 Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Inner border */}
      <path
        d="M40 11 L68 24 L68 57 Q68 80 40 88 Q12 80 12 57 L12 24 Z"
        stroke={color}
        strokeWidth="0.9"
        strokeLinejoin="round"
        opacity="0.45"
      />

      {/* Horizontal divider */}
      <line
        x1="15" y1="40" x2="65" y2="40"
        stroke={color}
        strokeWidth="0.9"
        opacity="0.45"
      />

      {/* RTD monogram */}
      <text
        x="40"
        y="37"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="'Bebas Neue', sans-serif"
        fontSize="21"
        letterSpacing="3"
        fill={color}
      >
        RTD
      </text>

      {/* Golf flag pole */}
      <line
        x1="40" y1="50" x2="40" y2="74"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Flag */}
      <polygon
        points="40,50 54,55.5 40,61"
        fill={color}
        opacity="0.85"
      />

      {/* Base arc / ground line */}
      <path
        d="M33 76 Q40 79 47 76"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  )
}
