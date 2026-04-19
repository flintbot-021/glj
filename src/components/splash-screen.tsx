import { useState, useEffect } from 'react'

const GREEN   = 'oklch(0.22 0.068 157)'
const GOLD    = 'oklch(0.80 0.14 72)'
const GOLD_FG = 'oklch(0.18 0.06 60)'
const GREY    = 'oklch(0.80 0 0)'

/**
 * Animation phases
 *   draw  → stroke animates on (grey outline, no fill)
 *   fill  → fill transitions to green, stroke turns green
 *   pop   → letters scale up (spring bounce)
 *   flip  → text → white, background → green
 *   ready → Continue button fades in
 */
type Phase = 'draw' | 'fill' | 'pop' | 'flip' | 'ready'

export function SplashScreen({ onContinue }: { onContinue: () => void }) {
  const [phase, setPhase] = useState<Phase>('draw')

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('fill'),   950),
      setTimeout(() => setPhase('pop'),   1450),
      setTimeout(() => setPhase('flip'),  1950),
      setTimeout(() => setPhase('ready'), 2700),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const isDark = phase === 'flip' || phase === 'ready'
  const isPopped = phase === 'pop' || phase === 'flip' || phase === 'ready'

  const textFill: string =
    phase === 'draw' ? 'transparent'
    : phase === 'fill' || phase === 'pop' ? GREEN
    : 'white'

  const textStroke: string =
    phase === 'draw' ? GREY
    : phase === 'fill' || phase === 'pop' ? GREEN
    : 'white'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? GREEN : 'white',
        transition: 'background-color 0.55s ease',
        gap: '2.5rem',
      }}
    >
      <style>{`
        @keyframes rtd-stroke-draw {
          from { stroke-dashoffset: 2400; opacity: 1; }
          to   { stroke-dashoffset: 0;    opacity: 1; }
        }
        @keyframes splash-continue-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-dot-pulse {
          0%, 100% { opacity: 0.3; transform: scaleX(1); }
          50%       { opacity: 1;   transform: scaleX(1.6); }
        }
      `}</style>

      {/* ── RTD LOGO ──────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: isPopped ? 'scale(1.65)' : 'scale(1)',
          transition: 'transform 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        {/* RTD lettering */}
        <svg viewBox="0 0 340 130" width={240} height={92}>
          {/* Ghost underlay — very subtle grey to show scale of letters while drawing */}
          <text
            x="170" y="115"
            textAnchor="middle"
            fontFamily="'Bebas Neue', sans-serif"
            fontSize="120"
            letterSpacing="8"
            fill={GREY}
            opacity={phase === 'draw' ? 0.08 : 0}
            style={{ transition: 'opacity 0.3s ease' }}
          >
            RTD
          </text>

          {/* Animated draw text */}
          <text
            x="170" y="115"
            textAnchor="middle"
            fontFamily="'Bebas Neue', sans-serif"
            fontSize="120"
            letterSpacing="8"
            fill={textFill}
            stroke={textStroke}
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeDasharray="2400"
            style={{
              animation: 'rtd-stroke-draw 0.95s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              transition: 'fill 0.45s ease, stroke 0.45s ease',
            }}
          >
            RTD
          </text>
        </svg>

        {/* Tagline — fades in after fill phase */}
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '11px',
            letterSpacing: '0.35em',
            color: textFill === 'transparent' ? 'transparent' : textFill,
            opacity: phase === 'draw' ? 0 : 0.6,
            transition: 'opacity 0.5s ease, color 0.45s ease',
            textTransform: 'uppercase',
          }}
        >
          Road to Dias
        </span>
      </div>

      {/* ── ACTIVITY DOTS (while animating) ───────────────────── */}
      {phase !== 'ready' && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            opacity: isPopped ? 0 : 1,
            transition: 'opacity 0.3s ease',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: '999px',
                backgroundColor: isDark ? 'rgba(255,255,255,0.4)' : GREY,
                animation: `splash-dot-pulse 1.1s ${i * 0.18}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── CONTINUE BUTTON ───────────────────────────────────── */}
      {phase === 'ready' && (
        <button
          onClick={onContinue}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: GOLD,
            color: GOLD_FG,
            border: 'none',
            borderRadius: '999px',
            padding: '14px 40px',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '22px',
            letterSpacing: '0.18em',
            cursor: 'pointer',
            animation: 'splash-continue-in 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            boxShadow: `0 4px 24px oklch(0.80 0.14 72 / 0.45)`,
          }}
        >
          Continue
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}
