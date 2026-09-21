import { VALIDATION } from '@/infrastructure/config/constants';

export type IcadType = 'microchip' | 'tattoo' | 'unknown';

export interface IcadValidationResult {
  isValid: boolean;
  type: IcadType;
  normalized: string;
  message?: string;
}

export function normalizeIcadNumber(icad: string): string {
  return icad.trim().toUpperCase().replace(/\s+/g, '');
}

export function getIcadType(icad: string): IcadType {
  const normalized = normalizeIcadNumber(icad);
  
  if (VALIDATION.icad.microchipPattern.test(normalized)) {
    return 'microchip';
  }
  
  if (VALIDATION.icad.tattooPattern.test(normalized)) {
    return 'tattoo';
  }
  
  return 'unknown';
}

export function validateIcadNumber(icad: string): IcadValidationResult {
  if (!icad || icad.trim().length === 0) {
    return {
      isValid: false,
      type: 'unknown',
      normalized: '',
      message: 'Le numéro ICAD est requis',
    };
  }

  const normalized = normalizeIcadNumber(icad);
  const type = getIcadType(normalized);

  if (type === 'unknown') {
    return {
      isValid: false,
      type: 'unknown',
      normalized,
      message: VALIDATION.icad.message,
    };
  }

  return {
    isValid: true,
    type,
    normalized,
    message: type === 'microchip' 
      ? 'Puce électronique valide' 
      : 'Tatouage valide',
  };
}

export function validateIcadNumbers(icads: string[]): {
  isValid: boolean;
  results: IcadValidationResult[];
  errors: string[];
} {
  if (!icads || icads.length === 0) {
    return {
      isValid: false,
      results: [],
      errors: ['Au moins un numéro ICAD est requis'],
    };
  }

  const results = icads.map(validateIcadNumber);
  const errors = results
    .filter(r => !r.isValid)
    .map(r => r.message || 'Numéro ICAD invalide');

  const normalized = results.map(r => r.normalized);
  const duplicates = normalized.filter((item, index) => normalized.indexOf(item) !== index);
  
  if (duplicates.length > 0) {
    errors.push(`Numéros ICAD en double : ${duplicates.join(', ')}`);
  }

  return {
    isValid: results.every(r => r.isValid) && duplicates.length === 0,
    results,
    errors,
  };
}

export function formatIcadNumber(icad: string): string {
  const normalized = normalizeIcadNumber(icad);
  const type = getIcadType(normalized);

  if (type === 'microchip') {
    return normalized.replace(/(\d{3})(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4 $5');
  }

  if (type === 'tattoo') {
    if (/^[A-Z]{3}\d{3}$/.test(normalized)) {
      return normalized.replace(/([A-Z]{3})(\d{3})/, '$1 $2');
    }
    if (/^\d{6}[A-Z]{3}$/.test(normalized)) {
      return normalized.replace(/(\d{6})([A-Z]{3})/, '$1 $2');
    }
  }

  return normalized;
}

export function useIcadValidation() {
  const validate = (icad: string): string | undefined => {
    const result = validateIcadNumber(icad);
    return result.isValid ? undefined : result.message;
  };

  const validateMultiple = (icads: string[]): string | undefined => {
    const result = validateIcadNumbers(icads);
    return result.isValid ? undefined : result.errors[0];
  };

  return {
    validate,
    validateMultiple,
    normalizeIcadNumber,
    formatIcadNumber,
    getIcadType,
  };
}
