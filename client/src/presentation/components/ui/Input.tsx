import React, { memo, forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Composant Input réutilisable avec label et gestion d'erreur
 * Utilise forwardRef pour permettre l'accès au ref
 * Utilise React.memo pour optimiser les performances
 */
export const Input = memo(
  forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = '', ...props }, ref) => {
      const baseInputStyles = 'block w-full border-2 rounded-lg p-2.5 sm:p-3 transition text-sm sm:text-base text-black';
      const errorStyles = error
        ? 'border-red-500 focus:border-red-500'
        : 'border-[#D2691E]/30 focus:border-[#D2691E]';

      return (
        <div className="w-full">
          {label && (
            <label className="block mb-1">
              <span className="text-[#8B4513] font-semibold text-sm sm:text-base">
                {label}
              </span>
            </label>
          )}
          
          <input
            ref={ref}
            className={`${baseInputStyles} ${errorStyles} ${className}`}
            {...props}
          />
          
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
          
          {helperText && !error && (
            <p className="mt-1 text-sm text-[#8B4513]/60">{helperText}</p>
          )}
        </div>
      );
    }
  )
);

Input.displayName = 'Input';
