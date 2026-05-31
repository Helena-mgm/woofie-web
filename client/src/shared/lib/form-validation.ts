import { VALIDATION } from '@/infrastructure/config/constants';
import { validateIcadNumber } from '@/shared/lib/icad-validator';
import type { OwnerRegisterFormData, SitterRegisterFormData } from '@/types';

/**
 * Validation du formulaire Owner
 * Règle: fonction pure, < 50 lignes
 */
export function validateOwnerForm(data: OwnerRegisterFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  // Nom
  if (!data.nom.trim()) {
    errors.nom = 'Nom requis';
  } else if (!VALIDATION.name.pattern.test(data.nom)) {
    errors.nom = VALIDATION.name.message;
  }

  // Prénom
  if (!data.prenom.trim()) {
    errors.prenom = 'Prénom requis';
  } else if (!VALIDATION.name.pattern.test(data.prenom)) {
    errors.prenom = VALIDATION.name.message;
  }

  // Email
  if (!data.email.trim()) {
    errors.email = 'Email requis';
  } else if (!VALIDATION.email.pattern.test(data.email)) {
    errors.email = VALIDATION.email.message;
  }

  // Téléphone
  const phoneClean = data.telephone.replace(/\s/g, '');
  if (!phoneClean) {
    errors.telephone = 'Numéro de téléphone requis';
  } else if (!VALIDATION.phone.pattern.test(phoneClean)) {
    errors.telephone = VALIDATION.phone.message;
  }

  // Mot de passe
  if (!data.password) {
    errors.password = 'Mot de passe requis';
  } else if (data.password.length < VALIDATION.password.minLength) {
    errors.password = VALIDATION.password.message;
  }

  // Chiens
  if (!data.dogs || data.dogs.length === 0) {
    errors.dogs = 'Au moins un chien est requis';
  } else {
    const seenIcadNumbers = new Set<string>();
    // Valider chaque chien
    for (let i = 0; i < data.dogs.length; i++) {
      const dog = data.dogs[i];
      
      if (!dog.icadNumber) {
        errors.dogs = `Numéro ICAD requis pour le chien ${i + 1}`;
        break;
      }

      const icadClean = dog.icadNumber.trim();
      if (seenIcadNumbers.has(icadClean)) {
        errors.dogs = 'Chaque chien doit avoir un numéro ICAD unique';
        break;
      }
      seenIcadNumbers.add(icadClean);
      
      const icadValidation = validateIcadNumber(dog.icadNumber);
      if (!icadValidation.isValid) {
        errors.dogs = `Numéro ICAD invalide pour ${dog.nom || `le chien ${i + 1}`}: ${icadValidation.message}`;
        break;
      }
      
      if (!dog.nom.trim()) {
        errors.dogs = `Nom requis pour le chien ${i + 1}`;
        break;
      }
      
      if (!dog.sexe) {
        errors.dogs = `Sexe requis pour ${dog.nom}`;
        break;
      }
      
      if (!dog.race.trim()) {
        errors.dogs = `Race requise pour ${dog.nom}`;
        break;
      }
      
      if (!dog.dateNaissance) {
        errors.dogs = `Date de naissance requise pour ${dog.nom}`;
        break;
      }
    }
  }

  // Ville
  if (!data.ville.trim()) {
    errors.ville = 'Ville requise';
  }

  return errors;
}

/**
 * Validation du formulaire Sitter
 * Règle: fonction pure, < 50 lignes
 */
export function validateSitterForm(data: SitterRegisterFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  // Nom
  if (!data.nom.trim()) {
    errors.nom = 'Nom requis';
  } else if (!VALIDATION.name.pattern.test(data.nom)) {
    errors.nom = VALIDATION.name.message;
  }

  // Prénom
  if (!data.prenom.trim()) {
    errors.prenom = 'Prénom requis';
  } else if (!VALIDATION.name.pattern.test(data.prenom)) {
    errors.prenom = VALIDATION.name.message;
  }

  // Email
  if (!data.email.trim()) {
    errors.email = 'Email requis';
  } else if (!VALIDATION.email.pattern.test(data.email)) {
    errors.email = VALIDATION.email.message;
  }

  // Téléphone
  const phoneClean = data.telephone.replace(/\s/g, '');
  if (!phoneClean) {
    errors.telephone = 'Numéro de téléphone requis';
  } else if (!VALIDATION.phone.pattern.test(phoneClean)) {
    errors.telephone = VALIDATION.phone.message;
  }

  // Mot de passe
  if (!data.password) {
    errors.password = 'Mot de passe requis';
  } else if (data.password.length < VALIDATION.password.minLength) {
    errors.password = VALIDATION.password.message;
  }

  // Ville
  if (!data.ville.trim()) {
    errors.ville = 'Ville requise';
  }

  // SIRET
  if (!data.siret.trim()) {
    errors.siret = 'Numéro SIRET requis';
  }

  // Bio
  if (!data.bio.trim()) {
    errors.bio = 'Présentez vos services en quelques phrases';
  } else if (data.bio.trim().length < 30) {
    errors.bio = 'Décrivez-vous en au moins 30 caractères';
  }

  // Services proposés
  if (!data.services || data.services.length === 0) {
    errors.services = 'Sélectionnez au moins un service proposé';
  }

  // Tarif horaire
  if (data.price_per_hour === '' || Number(data.price_per_hour) <= 0) {
    errors.price_per_hour = 'Indiquez un tarif horaire valide';
  }

  // Expérience (optionnelle mais doit être positive)
  if (data.experience_years !== '' && Number(data.experience_years) < 0) {
    errors.experience_years = 'L\'expérience doit être positive';
  }

  return errors;
}
