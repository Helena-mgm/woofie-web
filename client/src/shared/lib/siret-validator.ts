import { VALIDATION } from '@/infrastructure/config/constants';

const siretDebugEnabled = process.env.NEXT_PUBLIC_SIRET_DEBUG === 'true';

export interface SiretValidationResult {
  isValid: boolean;
  formatted: string;
  exists?: boolean;
  companyName?: string;
  message?: string;
}

export const normalizeSiret = (siret: string): string => {
  const trimmed = siret.trim();
  if (!trimmed || !/^[\d\s.-]+$/.test(trimmed)) {
    return '';
  }

  return trimmed.replace(/[\s.-]+/g, '');
};

export const formatSiret = (siret: string): string => {
  const normalized = normalizeSiret(siret);

  if (normalized.length !== 14) {
    return normalized;
  }

  return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9, 14)}`;
};

export const isValidFormat = (siret: string): boolean => {
  const normalized = normalizeSiret(siret);
  return VALIDATION.siret.pattern.test(normalized);
};

export const validateLuhn = (siret: string): boolean => {
  const normalized = normalizeSiret(siret);

  if (!isValidFormat(normalized)) {
    return false;
  }

  let sum = 0;

  for (let i = 13, positionFromRight = 0; i >= 0; i--, positionFromRight++) {
    let digit = parseInt(normalized[i], 10);

    if (positionFromRight % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
  }

  return sum % 10 === 0;
};

export const checkSiretExistence = async (siret: string): Promise<{
  exists: boolean;
  companyName?: string;
  error?: string;
}> => {
  const normalized = normalizeSiret(siret);

  if (!isValidFormat(normalized)) {
    return { exists: false, error: 'Format SIRET invalide' };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
    const response = await fetch(`${baseUrl}/api/siret/${normalized}`);

    if (!response.ok) {
      return { exists: false, error: `Erreur serveur (${response.status})` };
    }

    const data = await response.json();

    if (!data.isValid) {
      return { exists: false, error: data.message };
    }

    return {
      exists: data.exists ?? false,
      companyName: data.companyName ?? undefined,
      error: data.exists ? undefined : (data.message || 'Vérification API non disponible'),
    };
  } catch (error) {
    if (siretDebugEnabled) {
      console.error('Erreur vérification SIRET:', error);
    }
    return {
      exists: false,
      error: 'Erreur lors de la vérification du SIRET',
    };
  }
};

export const validateSiret = async (
  siret: string,
  checkExistence: boolean = true
): Promise<SiretValidationResult> => {
  const normalized = normalizeSiret(siret);

  if (!isValidFormat(normalized)) {
    return {
      isValid: false,
      formatted: siret,
      message: VALIDATION.siret.message,
    };
  }

  if (!validateLuhn(normalized)) {
    return {
      isValid: false,
      formatted: formatSiret(normalized),
      message: 'SIRET invalide (clé de contrôle incorrecte)',
    };
  }

  if (checkExistence) {
    const existenceCheck = await checkSiretExistence(normalized);

    if (existenceCheck.exists) {
      return {
        isValid: true,
        formatted: formatSiret(normalized),
        exists: true,
        companyName: existenceCheck.companyName,
        message: `✓ Entreprise trouvée : ${existenceCheck.companyName}`,
      };
    } else {
      return {
        isValid: true,
        formatted: formatSiret(normalized),
        exists: false,
        message: existenceCheck.error || 'SIRET valide (vérification manuelle requise)',
      };
    }
  }

  return {
    isValid: true,
    formatted: formatSiret(normalized),
    message: 'SIRET valide (format et clé de contrôle corrects)',
  };
};

export const useSiretValidation = () => {
  return {
    validateSiret,
    formatSiret,
    normalizeSiret,
    isValidFormat,
    validateLuhn,
  };
};
