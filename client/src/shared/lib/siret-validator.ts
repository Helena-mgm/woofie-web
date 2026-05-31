/**
 * Bibliothèque de validation SIRET
 * 
 * Le SIRET (Système d'Identification du Répertoire des Établissements) est un numéro de 14 chiffres :
 * - 9 premiers chiffres = SIREN (identifiant de l'entreprise)
 * - 5 derniers chiffres = NIC (Numéro Interne de Classement, identifiant de l'établissement)
 * 
 * Validation :
 * 1. Format : exactement 14 chiffres
 * 2. Algorithme de Luhn (checksum)
 * 3. API Sirene (INSEE) pour vérifier l'existence réelle
 */

import { VALIDATION } from '@/infrastructure/config/constants';

export interface SiretValidationResult {
  isValid: boolean;
  formatted: string;
  exists?: boolean; // true si vérifié via API Sirene
  companyName?: string; // Nom de l'entreprise depuis l'API
  message?: string;
}

/**
 * Normalise un numéro SIRET (enlève espaces et caractères spéciaux)
 */
export const normalizeSiret = (siret: string): string => {
  return siret.replace(/\s/g, '').trim();
};

/**
 * Formate un SIRET pour l'affichage : XXX XXX XXX XXXXX
 */
export const formatSiret = (siret: string): string => {
  const normalized = normalizeSiret(siret);
  
  if (normalized.length !== 14) {
    return normalized;
  }
  
  // Format : 3-3-3-5
  return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9, 14)}`;
};

/**
 * Valide le format du SIRET (14 chiffres)
 */
export const isValidFormat = (siret: string): boolean => {
  const normalized = normalizeSiret(siret);
  return VALIDATION.siret.pattern.test(normalized);
};

/**
 * Algorithme de Luhn pour valider la clé de contrôle du SIRET
 * Le dernier chiffre du SIRET est une clé de contrôle calculée avec l'algorithme de Luhn
 */
export const validateLuhn = (siret: string): boolean => {
  const normalized = normalizeSiret(siret);
  
  if (!isValidFormat(normalized)) {
    return false;
  }
  
  let sum = 0;
  
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(normalized[i], 10);
    
    // Pour les positions paires (index impair car on compte de droite à gauche)
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
  }
  
  return sum % 10 === 0;
};

/**
 * Vérifie si le SIRET existe dans la base de données Sirene (API publique INSEE)
 * 
 * API Sirene : https://api.insee.fr/entreprises/sirene/V3/
 * Note : Nécessite une clé API INSEE pour la production
 * 
 * Pour l'instant, on utilise l'API publique sans authentification (quota limité)
 */
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
    // API Sirene publique (sans authentification, quota limité)
    // En production, il faudra obtenir une clé API INSEE
    const response = await fetch(
      `https://api.insee.fr/entreprises/sirene/V3/siret/${normalized}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (response.status === 404) {
      return { exists: false, error: 'SIRET non trouvé dans la base Sirene' };
    }
    
    if (response.status === 403 || response.status === 401) {
      // Pas de clé API, mais on continue (on validera juste le format et Luhn)
      console.warn('API Sirene: Authentification requise. Validation limitée au format.');
      return { exists: false, error: 'Vérification API non disponible (nécessite clé API INSEE)' };
    }
    
    if (!response.ok) {
      throw new Error(`API Sirene error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extraction du nom de l'entreprise
    const companyName = 
      data.etablissement?.uniteLegale?.denominationUniteLegale ||
      data.etablissement?.uniteLegale?.prenomUsuelUniteLegale + ' ' + data.etablissement?.uniteLegale?.nomUniteLegale ||
      'Entreprise trouvée';
    
    return { 
      exists: true, 
      companyName: companyName.trim() 
    };
    
  } catch (error) {
    console.error('Erreur vérification SIRET:', error);
    return { 
      exists: false, 
      error: 'Erreur lors de la vérification du SIRET' 
    };
  }
};

/**
 * Validation complète du SIRET
 * 1. Format (14 chiffres)
 * 2. Algorithme de Luhn
 * 3. Existence via API Sirene (optionnel, peut échouer sans clé API)
 */
export const validateSiret = async (
  siret: string,
  checkExistence: boolean = true
): Promise<SiretValidationResult> => {
  const normalized = normalizeSiret(siret);
  
  // 1. Vérifier le format
  if (!isValidFormat(normalized)) {
    return {
      isValid: false,
      formatted: siret,
      message: VALIDATION.siret.message,
    };
  }
  
  // 2. Vérifier l'algorithme de Luhn
  if (!validateLuhn(normalized)) {
    return {
      isValid: false,
      formatted: formatSiret(normalized),
      message: 'SIRET invalide (clé de contrôle incorrecte)',
    };
  }
  
  // 3. Vérifier l'existence (si demandé)
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
      // Si l'API ne fonctionne pas, on accepte quand même (format + Luhn OK)
      // L'admin vérifiera manuellement
      return {
        isValid: true,
        formatted: formatSiret(normalized),
        exists: false,
        message: existenceCheck.error || 'SIRET valide (vérification manuelle requise)',
      };
    }
  }
  
  // Validation basique uniquement (format + Luhn)
  return {
    isValid: true,
    formatted: formatSiret(normalized),
    message: 'SIRET valide (format et clé de contrôle corrects)',
  };
};

/**
 * Hook React pour la validation SIRET
 */
export const useSiretValidation = () => {
  return {
    validateSiret,
    formatSiret,
    normalizeSiret,
    isValidFormat,
    validateLuhn,
  };
};
