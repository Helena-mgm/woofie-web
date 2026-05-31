import { motion } from 'framer-motion';

/**
 * Configuration des empreintes de pattes
 * Règle: Données séparées de la logique de rendu
 */
interface PawConfig {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  size: string;
  opacity: string;
  yMove: [number, number, number];
  rotate: [number, number, number];
  duration: number;
  delay: number;
  scale?: [number, number, number];
}

const pawConfigs: PawConfig[] = [
  // Gauche haut
  { top: '5rem', left: '2.5rem', size: 'text-6xl', opacity: 'opacity-50', yMove: [0, -20, 0], rotate: [0, 10, 0], duration: 6, delay: 0 },
  { top: '10rem', left: '8rem', size: 'text-5xl', opacity: 'opacity-45', yMove: [0, 15, 0], rotate: [0, -8, 0], duration: 7, delay: 0.5 },
  { top: '16rem', left: '5rem', size: 'text-7xl', opacity: 'opacity-40', yMove: [0, -25, 0], rotate: [0, 12, 0], duration: 8, delay: 1 },
  { top: '24rem', left: '12rem', size: 'text-5xl', opacity: 'opacity-50', yMove: [0, 18, 0], rotate: [0, -10, 0], duration: 6.5, delay: 1.5 },
  { bottom: '20rem', left: '4rem', size: 'text-6xl', opacity: 'opacity-45', yMove: [0, -22, 0], rotate: [0, 15, 0], duration: 7.5, delay: 2 },
  { bottom: '10rem', left: '9rem', size: 'text-5xl', opacity: 'opacity-48', yMove: [0, 20, 0], rotate: [0, -12, 0], duration: 6, delay: 2.5 },
  
  // Droite haut
  { top: '8rem', right: '4rem', size: 'text-7xl', opacity: 'opacity-42', yMove: [0, -18, 0], rotate: [0, -10, 0], duration: 7, delay: 0.3 },
  { top: '14rem', right: '10rem', size: 'text-5xl', opacity: 'opacity-50', yMove: [0, 22, 0], rotate: [0, 12, 0], duration: 6.5, delay: 0.8 },
  { top: '20rem', right: '6rem', size: 'text-6xl', opacity: 'opacity-45', yMove: [0, -20, 0], rotate: [0, -15, 0], duration: 8, delay: 1.3 },
  { top: '30rem', right: '13rem', size: 'text-5xl', opacity: 'opacity-48', yMove: [0, 25, 0], rotate: [0, 10, 0], duration: 7.5, delay: 1.8 },
  { bottom: '18rem', right: '5rem', size: 'text-7xl', opacity: 'opacity-42', yMove: [0, -23, 0], rotate: [0, -12, 0], duration: 6, delay: 2.3 },
  { bottom: '8rem', right: '11rem', size: 'text-6xl', opacity: 'opacity-50', yMove: [0, 18, 0], rotate: [0, 8, 0], duration: 7, delay: 2.8 },
  
  // Centre
  { top: '25%', left: '33%', size: 'text-5xl', opacity: 'opacity-40', yMove: [0, -15, 0], rotate: [0, 5, 0], duration: 9, delay: 3, scale: [1, 1.1, 1] },
  { top: '66%', right: '33%', size: 'text-6xl', opacity: 'opacity-42', yMove: [0, 20, 0], rotate: [0, -7, 0], duration: 8.5, delay: 3.5, scale: [1, 1.15, 1] },
];

function AnimatedPaw({ config }: { config: PawConfig }) {
  const { top, bottom, left, right, size, opacity, yMove, rotate, duration, delay, scale } = config;
  
  const positionStyles = {
    ...(top && { top }),
    ...(bottom && { bottom }),
    ...(left && { left }),
    ...(right && { right }),
  };

  return (
    <motion.div
      className={`absolute ${size} ${opacity}`}
      style={{ 
        ...positionStyles,
        filter: 'sepia(1) saturate(3) hue-rotate(-10deg) brightness(0.6)' 
      }}
      animate={{
        y: yMove,
        rotate,
        ...(scale && { scale }),
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      🐾
    </motion.div>
  );
}

/**
 * Composant des empreintes de pattes animées en arrière-plan
 * Règle: Rendu simple, données externalisées
 */
export function AnimatedPawPrints() {
  return (
    <div className="hidden md:block fixed inset-0 pointer-events-none z-0">
      {pawConfigs.map((config, index) => (
        <AnimatedPaw key={index} config={config} />
      ))}
    </div>
  );
}
