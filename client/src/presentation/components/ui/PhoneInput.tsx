import { memo, forwardRef, type InputHTMLAttributes } from 'react';

export interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Composant Input pour numéro de téléphone
 * - Format français : 0X XX XX XX XX
 * - Validation automatique
 * - Formatage en temps réel
 */
export const PhoneInput = memo(
  forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
    { label, error, helperText, className = '', required, value, onChange, ...props },
    ref
  ) {
    // Formatte le numéro au format 0X XX XX XX XX
    const formatPhoneNumber = (val: string): string => {
      // Garde uniquement les chiffres
      const cleaned = val.replace(/\D/g, '');
      
      // Limite à 10 chiffres
      const limited = cleaned.substring(0, 10);
      
      // Formate par groupe de 2
      const match = limited.match(/^(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})$/);
      
      if (!match) return limited;
      
      return [match[1], match[2], match[3], match[4], match[5]]
        .filter(Boolean)
        .join(' ')
        .trim();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      
      // Créer un nouvel événement avec la valeur formatée
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formatted,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange?.(syntheticEvent);
    };

    return (
      <div className={`mb-4 ${className}`}>
        {label && (
          <label className="block mb-1">
            <span className="text-[#8B4513] font-semibold text-sm sm:text-base">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
        )}

        <input
          ref={ref}
          type="tel"
          className={`
            block w-full border-2 rounded-lg p-2.5 sm:p-3 transition text-sm sm:text-base text-black
            ${error 
              ? 'border-red-500 focus:border-red-600' 
              : 'border-[#D2691E]/30 focus:border-[#D2691E]'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          placeholder="06 12 34 56 78"
          value={value}
          onChange={handleChange}
          required={required}
          {...props}
        />

        {helperText && !error && (
          <p className="mt-1 text-xs text-[#8B4513]/60">{helperText}</p>
        )}

        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  })
);
