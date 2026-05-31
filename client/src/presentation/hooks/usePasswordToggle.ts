import { useState, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer la visibilité du mot de passe
 * @returns {Object} - showPassword et fonction toggle
 */
export function usePasswordToggle() {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return {
    showPassword,
    togglePassword,
    inputType: showPassword ? 'text' : 'password',
    icon: showPassword ? '\u{1F513}' : '\u{1F512}',
    ariaLabel: showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe',
  };
}
