import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateIcadNumber, formatIcadNumber } from '@/shared/lib/icad-validator';
import { LIMITS } from '@/infrastructure/config/constants';

export interface MultiIcadInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  value: string[]; // Liste des numéros ICAD
  onChange: (icads: string[]) => void;
  required?: boolean;
  disabled?: boolean;
  maxItems?: number;
}

/**
 * Composant pour gérer plusieurs numéros ICAD
 * - Ajout/suppression de numéros
 * - Validation en temps réel
 * - Affichage du type (puce/tatouage)
 * - Limite configurable
 */
export const MultiIcadInput = memo<MultiIcadInputProps>(function MultiIcadInput({
  label = 'Numéros ICAD de vos chiens',
  error,
  helperText,
  value = [],
  onChange,
  required,
  disabled,
  maxItems = LIMITS.maxIcadNumbers,
}) {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!inputValue.trim()) {
      setInputError('Veuillez entrer un numéro ICAD');
      return;
    }

    // Vérifier la limite
    if (value.length >= maxItems) {
      setInputError(`Maximum ${maxItems} numéros autorisés`);
      return;
    }

    // Valider le numéro
    const validation = validateIcadNumber(inputValue);
    
    if (!validation.isValid) {
      setInputError(validation.message || 'Numéro ICAD invalide');
      return;
    }

    // Vérifier les doublons
    if (value.includes(validation.normalized)) {
      setInputError('Ce numéro ICAD existe déjà dans la liste');
      return;
    }

    // Ajouter le numéro normalisé
    onChange([...value, validation.normalized]);
    setInputValue('');
    setInputError(null);
  };

  const handleRemove = (icad: string) => {
    onChange(value.filter(i => i !== icad));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block mb-2">
          <span className="text-[#8B4513] font-semibold text-sm sm:text-base">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </label>
      )}

      {/* Input pour ajouter un numéro */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <input
            type="text"
            className={`
              block w-full border-2 rounded-lg p-2.5 sm:p-3 transition text-sm sm:text-base text-black
              ${inputError || error
                ? 'border-red-500 focus:border-red-600'
                : 'border-[#D2691E]/30 focus:border-[#D2691E]'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            placeholder="Ex: 250269801234567 ou ABC123"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value.toUpperCase());
              setInputError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled || value.length >= maxItems}
          />
          {inputError && (
            <p className="mt-1 text-xs text-red-500">{inputError}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || value.length >= maxItems}
          className="px-4 py-2 bg-[#D2691E] text-white rounded-lg hover:bg-[#8B4513] transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm sm:text-base whitespace-nowrap"
        >
          + Ajouter
        </button>
      </div>

      {/* Liste des numéros ajoutés */}
      {value.length > 0 && (
        <div className="space-y-2 mb-2">
          <AnimatePresence>
            {value.map((icad) => {
              const validation = validateIcadNumber(icad);
              const formatted = formatIcadNumber(icad);
              
              return (
                <motion.div
                  key={icad}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between gap-3 p-3 bg-[#FFF5E6] border border-[#D2691E]/20 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-mono text-sm sm:text-base text-[#8B4513] font-semibold">
                      {formatted}
                    </p>
                    <p className="text-xs text-[#8B4513]/60">
                      {validation.type === 'microchip' && '🔹 Puce électronique'}
                      {validation.type === 'tattoo' && '🎨 Tatouage'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(icad)}
                    disabled={disabled}
                    className="text-red-500 hover:text-red-700 transition font-bold text-lg disabled:opacity-50"
                    aria-label="Supprimer"
                  >
                    ✕
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Compteur */}
      <p className="text-xs text-[#8B4513]/60 mb-1">
        {value.length} / {maxItems} numéros ajoutés
      </p>

      {/* Helper text ou erreur globale */}
      {helperText && !error && (
        <p className="text-xs text-[#8B4513]/60">{helperText}</p>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Info sur les formats acceptés */}
      {value.length === 0 && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 font-semibold mb-1">ℹ️ Formats acceptés :</p>
          <ul className="text-xs text-blue-700 space-y-1 ml-4">
            <li>• Puce électronique : 15 chiffres (ex: 250269801234567)</li>
            <li>• Tatouage : ABC123 ou 123456ABC</li>
          </ul>
        </div>
      )}
    </div>
  );
});
