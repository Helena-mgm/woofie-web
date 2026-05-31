import React, { memo } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantStyles = {
  primary: 'bg-[#D2691E] hover:bg-[#8B4513] text-white',
  secondary: 'bg-[#8B4513] hover:bg-[#6B4423] text-white',
  outline: 'border-2 border-[#D2691E] text-[#D2691E] hover:bg-[#D2691E] hover:text-white',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

/**
 * Composant Button réutilisable et optimisé
 * Utilise React.memo pour éviter les re-renders inutiles
 */
export const Button = memo<ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-full font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const widthStyles = fullWidth ? 'w-full' : '';
  
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`;

  return (
    <motion.button
      className={combinedClassName}
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Chargement...' : children}
    </motion.button>
  );
});

Button.displayName = 'Button';
