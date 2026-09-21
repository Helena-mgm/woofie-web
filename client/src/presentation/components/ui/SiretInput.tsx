import { memo, forwardRef, useState, useEffect, type InputHTMLAttributes } from 'react';
import { validateSiret, formatSiret, normalizeSiret, type SiretValidationResult } from '@/shared/lib/siret-validator';

export interface SiretInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  onValidation?: (result: SiretValidationResult) => void;
}

const SIRET_CHECK_ENABLED = process.env.NEXT_PUBLIC_SIRET_CHECK !== 'false';
const SIRET_DEBUG_ENABLED = process.env.NEXT_PUBLIC_SIRET_DEBUG === 'true';

export const SiretInput = memo(
  forwardRef<HTMLInputElement, SiretInputProps>(function SiretInput(
    { label, error, helperText, className = '', required, value, onChange, onValidation, ...props },
    ref
  ) {
    const [validationResult, setValidationResult] = useState<SiretValidationResult | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
      const siret = value as string;
      
      if (!siret || siret.length === 0) {
        setValidationResult(null);
        return;
      }

      const normalized = normalizeSiret(siret);
      
      if (normalized.length !== 14) {
        setValidationResult(null);
        return;
      }

      const timeoutId = setTimeout(async () => {
        setIsValidating(true);
        
        try {
          const result = await validateSiret(normalized, SIRET_CHECK_ENABLED);
          setValidationResult(result);
          onValidation?.(result);
        } catch (err) {
          if (SIRET_DEBUG_ENABLED) {
            console.error('Erreur validation SIRET:', err);
          }
          setValidationResult({
            isValid: false,
            formatted: siret,
            message: 'Erreur lors de la validation du SIRET',
          });
        } finally {
          setIsValidating(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }, [value, onValidation]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleaned = e.target.value.replace(/\D/g, '');
      const limited = cleaned.substring(0, 14);
      const formatted = formatSiret(limited);
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formatted,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange?.(syntheticEvent);
    };

    const getBorderColor = () => {
      if (error) return 'border-red-500 focus:border-red-600';
      if (validationResult?.isValid && validationResult.exists) {
        return 'border-green-500 focus:border-green-600';
      }
      if (validationResult?.isValid && !validationResult.exists) {
        return 'border-orange-400 focus:border-orange-500';
      }
      if (validationResult && !validationResult.isValid) {
        return 'border-red-500 focus:border-red-600';
      }
      return 'border-[#D2691E]/30 focus:border-[#D2691E]';
    };

    const getStatusIcon = () => {
      if (isValidating) {
        return <span className="text-blue-500 animate-spin">⌛</span>;
      }
      if (validationResult?.isValid && validationResult.exists) {
        return <span className="text-green-600" title="SIRET vérifié">✓</span>;
      }
      if (validationResult?.isValid && !validationResult.exists) {
        return <span className="text-orange-500" title="SIRET valide mais non vérifié">⚠</span>;
      }
      if (validationResult && !validationResult.isValid) {
        return <span className="text-red-500" title="SIRET invalide">✗</span>;
      }
      return null;
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

        <div className="relative">
          <input
            ref={ref}
            type="text"
            className={`
              block w-full border-2 rounded-lg p-2.5 sm:p-3 pr-10 transition text-sm sm:text-base text-black
              ${getBorderColor()}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            placeholder="123 456 789 01234"
            value={value}
            onChange={handleChange}
            required={required}
            {...props}
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xl">
            {getStatusIcon()}
          </div>
        </div>

        {validationResult?.message && !error && (
          <p className={`mt-1 text-xs ${
            validationResult.isValid && validationResult.exists
              ? 'text-green-600'
              : validationResult.isValid && !validationResult.exists
              ? 'text-orange-500'
              : 'text-red-500'
          }`}>
            {validationResult.message}
          </p>
        )}

        {helperText && !error && !validationResult?.message && (
          <p className="mt-1 text-xs text-[#8B4513]/60">{helperText}</p>
        )}

        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}

        {SIRET_CHECK_ENABLED && validationResult?.isValid && !validationResult.exists && (
          <p className="mt-2 text-xs text-[#8B4513]/70 bg-orange-50 p-2 rounded border border-orange-200">
            ℹ️ SIRET valide mais non vérifié par l&apos;API Sirene. Un administrateur devra valider votre compte manuellement.
          </p>
        )}

        {!SIRET_CHECK_ENABLED && validationResult?.isValid && (
          <p className="mt-2 text-xs text-[#8B4513]/70 bg-orange-50 p-2 rounded border border-orange-200">
            ℹ️ Vérification automatique désactivée. Le SIRET sera contrôlé manuellement.
          </p>
        )}
      </div>
    );
  })
);

SiretInput.displayName = 'SiretInput';
