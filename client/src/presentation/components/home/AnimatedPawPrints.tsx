/**
 * Empreintes décoratives – animations CSS pures (pas de framer-motion)
 * → compositor GPU, zéro overhead JS runtime
 */
interface PawConfig {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: string;
  opacity: number;
  duration: number;
  delay: number;
}

const pawConfigs: PawConfig[] = [
  { top: '6rem',     left: '3rem',    size: '3.5rem', opacity: 0.45, duration: 6,   delay: 0   },
  { top: '18rem',    left: '9rem',    size: '3rem',   opacity: 0.40, duration: 8,   delay: 1   },
  { bottom: '12rem', left: '5rem',    size: '4rem',   opacity: 0.42, duration: 7,   delay: 2.5 },
  { top: '8rem',     right: '5rem',   size: '4rem',   opacity: 0.40, duration: 7.5, delay: 0.4 },
  { top: '22rem',    right: '7rem',   size: '3rem',   opacity: 0.45, duration: 6.5, delay: 1.2 },
  { bottom: '10rem', right: '10rem',  size: '3.5rem', opacity: 0.42, duration: 8,   delay: 2   },
  { top: '35%',      left: '40%',     size: '2.5rem', opacity: 0.35, duration: 9,   delay: 3   },
  { top: '60%',      right: '35%',    size: '3rem',   opacity: 0.38, duration: 8.5, delay: 3.5 },
];

export function AnimatedPawPrints() {
  return (
    <div
      className="hidden md:block fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    >
      {pawConfigs.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: p.top,
            bottom: p.bottom,
            left: p.left,
            right: p.right,
            fontSize: p.size,
            opacity: p.opacity,
            filter: 'sepia(1) saturate(3) hue-rotate(-10deg) brightness(0.6)',
            animation: `pawFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
            willChange: 'transform',
          }}
        >
          🐾
        </div>
      ))}
    </div>
  );
}
