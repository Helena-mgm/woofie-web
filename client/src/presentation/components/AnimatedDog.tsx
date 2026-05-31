import { memo } from 'react';
import { motion } from 'framer-motion';
import type { DogAnimationState } from '@/types';

interface AnimatedDogProps extends DogAnimationState {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Composant SVG du chien animé réutilisable
 * Utilisé sur les pages de login et register
 * Optimisé avec React.memo pour éviter les re-renders inutiles
 */
export const AnimatedDog = memo<AnimatedDogProps>(function AnimatedDog({
  isPasswordFocused,
  isEmailFocused,
  showPassword,
  error,
  success,
  className = '',
  width = 200,
  height = 200,
}: AnimatedDogProps) {
  return (
    <motion.svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      className={`relative z-10 ${className}`}
      animate={success ? { rotate: [0, -5, 5, -5, 0] } : undefined}
      transition={{ duration: 0.5, repeat: success ? Infinity : 0 }}
    >
      {/* Corps du chien */}
      <ellipse cx="100" cy="140" rx="45" ry="35" fill="#D2691E" />

      {/* Tête */}
      <circle cx="100" cy="80" r="50" fill="#D2691E" />

      {/* Oreilles animées */}
      <motion.ellipse
        cx="65"
        cy="35"
        rx="15"
        ry="35"
        fill="#8B4513"
        animate={isEmailFocused ? { rotate: [0, -15, 0], y: [0, -5, 0] } : undefined}
        transition={{ duration: 0.6, repeat: isEmailFocused ? Infinity : 0 }}
        style={{ transformOrigin: '65px 45px' }}
      />
      <motion.ellipse
        cx="135"
        cy="35"
        rx="15"
        ry="35"
        fill="#8B4513"
        animate={isEmailFocused ? { rotate: [0, 15, 0], y: [0, -5, 0] } : undefined}
        transition={{ duration: 0.6, repeat: isEmailFocused ? Infinity : 0 }}
        style={{ transformOrigin: '135px 45px' }}
      />

      {/* Museau */}
      <ellipse cx="100" cy="95" rx="25" ry="20" fill="#FFE4B5" />

      {/* Nez animé */}
      <motion.ellipse
        cx="100"
        cy="90"
        rx="8"
        ry="6"
        fill="#2C1810"
        animate={isEmailFocused || isPasswordFocused ? { scale: [1, 1.1, 1] } : undefined}
        transition={{ duration: 0.4, repeat: isEmailFocused || isPasswordFocused ? Infinity : 0 }}
        style={{ transformOrigin: '100px 90px' }}
      />

      {/* Bouche - 3 états : normal, triste (erreur), sourire (succès) */}
      <motion.path
        d="M 85 100 Q 100 110 115 100"
        stroke="#2C1810"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        animate={
          error
            ? { d: 'M 85 110 Q 100 100 115 110' }
            : success
            ? { d: 'M 80 100 Q 100 115 120 100' }
            : undefined
        }
      />

      {/* Yeux ouverts (état par défaut - quand pas de focus sur password) */}
      <motion.g
        animate={!isPasswordFocused ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.1 }}
        transition={{ duration: 0.3 }}
        style={{ transformOrigin: '100px 70px' }}
      >
        <ellipse cx="80" cy="70" rx="8" ry="12" fill="white" />
        <ellipse cx="120" cy="70" rx="8" ry="12" fill="white" />
        <motion.circle
          cx="80"
          cy="72"
          r="5"
          fill="#2C1810"
          animate={success ? { scale: [1, 1.3, 1] } : undefined}
          transition={{ duration: 0.3, repeat: success ? Infinity : 0 }}
          style={{ transformOrigin: '80px 72px' }}
        />
        <motion.circle
          cx="120"
          cy="72"
          r="5"
          fill="#2C1810"
          animate={success ? { scale: [1, 1.3, 1] } : undefined}
          transition={{ duration: 0.3, repeat: success ? Infinity : 0 }}
          style={{ transformOrigin: '120px 72px' }}
        />
        <circle cx="82" cy="70" r="2" fill="white" />
        <circle cx="122" cy="70" r="2" fill="white" />
      </motion.g>

      {/* Un œil ouvert + un œil fermé (quand showPassword ET focus) */}
      <motion.g
        animate={showPassword && isPasswordFocused ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.1 }}
        transition={{ duration: 0.3 }}
        style={{ transformOrigin: '100px 70px' }}
      >
        <ellipse cx="120" cy="70" rx="8" ry="12" fill="white" />
        <circle cx="120" cy="72" r="5" fill="#2C1810" />
        <circle cx="122" cy="70" r="2" fill="white" />
        <path d="M 72 70 Q 80 72 88 70" stroke="#2C1810" strokeWidth="3" fill="none" strokeLinecap="round" />
      </motion.g>

      {/* Deux yeux fermés (quand !showPassword ET focus) */}
      <motion.g
        animate={!showPassword && isPasswordFocused ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <path d="M 72 70 Q 80 72 88 70" stroke="#2C1810" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 112 70 Q 120 72 128 70" stroke="#2C1810" strokeWidth="3" fill="none" strokeLinecap="round" />
      </motion.g>

      {/* Pattes qui montent (SEULEMENT quand !showPassword ET focus) */}
      <motion.g
        animate={!showPassword && isPasswordFocused ? { y: -45, opacity: 1 } : { y: 0, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Patte gauche */}
        <g>
          <ellipse cx="70" cy="115" rx="12" ry="20" fill="#D2691E" transform="rotate(-20 70 115)" />
          <circle cx="65" cy="125" r="4" fill="#8B4513" />
          <circle cx="72" cy="127" r="4" fill="#8B4513" />
          <circle cx="75" cy="123" r="4" fill="#8B4513" />
        </g>
        {/* Patte droite */}
        <g>
          <ellipse cx="130" cy="115" rx="12" ry="20" fill="#D2691E" transform="rotate(20 130 115)" />
          <circle cx="125" cy="123" r="4" fill="#8B4513" />
          <circle cx="128" cy="127" r="4" fill="#8B4513" />
          <circle cx="135" cy="125" r="4" fill="#8B4513" />
        </g>
      </motion.g>
    </motion.svg>
  );
});
