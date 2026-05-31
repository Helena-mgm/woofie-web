import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  gradient?: boolean;
}

export function Card({ 
  children, 
  className = '', 
  hoverEffect = false,
  gradient = false 
}: CardProps) {
  const baseStyles = 'rounded-2xl p-6 shadow-lg';
  const bgStyles = gradient 
    ? 'bg-gradient-to-br from-white to-orange-50' 
    : 'bg-white';
  
  return (
    <motion.div
      className={`${baseStyles} ${bgStyles} ${className}`}
      whileHover={hoverEffect ? { y: -5 } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
