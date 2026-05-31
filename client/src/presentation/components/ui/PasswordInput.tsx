import React, { memo } from 'react';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  showPassword: boolean;
  onTogglePassword: () => void;
  toggleIcon: string;
  toggleAriaLabel: string;
}

/**
 * Composant PasswordInput optimisé avec toggle de visibilité
 * Combine Input + bouton de toggle
 */
export const PasswordInput = memo<PasswordInputProps>(({
  label = 'Mot de passe',
  error,
  showPassword,
  onTogglePassword,
  toggleIcon,
  toggleAriaLabel,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <span className="block mb-1 text-[#8B4513] font-semibold text-sm sm:text-base">
          {label}
        </span>
      )}
      
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          className={`block w-full border-2 ${
            error ? 'border-red-500 focus:border-red-500' : 'border-[#D2691E]/30 focus:border-[#D2691E]'
          } rounded-lg p-2.5 sm:p-3 pr-12 transition text-sm sm:text-base text-black`}
          {...props}
        />
        
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl hover:scale-110 transition-transform"
          aria-label={toggleAriaLabel}
        >
          <span>{toggleIcon}</span>
        </button>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';
