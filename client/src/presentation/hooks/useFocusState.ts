import { useState, useCallback } from 'react';

/**
 * Hook pour gérer les états de focus des champs de formulaire
 * @returns {Object} - États et handlers de focus
 */
export function useFocusState() {
  const [focusStates, setFocusStates] = useState<Record<string, boolean>>({});

  const handleFocus = useCallback((fieldName: string) => {
    setFocusStates(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  const handleBlur = useCallback((fieldName: string) => {
    setFocusStates(prev => ({ ...prev, [fieldName]: false }));
  }, []);

  const isFocused = useCallback((fieldName: string) => {
    return focusStates[fieldName] || false;
  }, [focusStates]);

  return {
    handleFocus,
    handleBlur,
    isFocused,
    focusStates,
  };
}
