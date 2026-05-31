import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiPostMultipart } from '@/shared/lib/api-v2';
import { validateOwnerForm, validateSitterForm } from '@/shared/lib/form-validation';
import type { OwnerRegisterFormData, SitterRegisterFormData, DogInfo } from '@/types';

/**
 * Hook pour gérer l'inscription (Owner ou Sitter)
 * Règle: hook < 100 lignes, logique métier séparée
 */
export function useRegister() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<'owner' | 'sitter'>('owner');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [ownerData, setOwnerData] = useState<OwnerRegisterFormData>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    dogs: [],
    ville: '',
    photo: null,
  });

  const [sitterData, setSitterData] = useState<SitterRegisterFormData>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    ville: '',
    siret: '',
    photo: null,
    isVerified: false,
    bio: '',
    services: [],
    price_per_hour: '',
    is_available: true,
    experience_years: '',
  });

  const handleOwnerSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validateOwnerForm(ownerData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('type', 'owner');
      formData.append('nom', ownerData.nom);
      formData.append('prenom', ownerData.prenom);
      formData.append('email', ownerData.email);
      formData.append('telephone', ownerData.telephone);
      formData.append('password', ownerData.password);
      formData.append('ville', ownerData.ville);
      
      // Envoyer les informations des chiens (sans photos)
      formData.append('dogs', JSON.stringify(ownerData.dogs.map((dog: DogInfo) => ({
        icadNumber: dog.icadNumber,
        nom: dog.nom,
        sexe: dog.sexe,
        race: dog.race,
        dateNaissance: dog.dateNaissance,
      }))));
      
      // Ajouter la photo du propriétaire
      if (ownerData.photo) formData.append('photo', ownerData.photo);
      
      // Ajouter toutes les photos des chiens
      ownerData.dogs.forEach((dog: DogInfo, dogIndex: number) => {
        dog.photos.forEach((photo: File, photoIndex: number) => {
          formData.append(`dogPhoto_${dogIndex}_${photoIndex}`, photo);
        });
      });

      const response = await apiPostMultipart('/api/register', formData);
      
      if (!response.ok) {
        const errorMessage = response.data?.error || 'Erreur lors de l\'inscription';
        setErrors({ submit: errorMessage });
        setIsSubmitting(false);
        return;
      }
      
      setShowSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'inscription';
      setErrors({ submit: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSitterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validateSitterForm(sitterData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('type', 'sitter');
      formData.append('nom', sitterData.nom);
      formData.append('prenom', sitterData.prenom);
      formData.append('email', sitterData.email);
      formData.append('telephone', sitterData.telephone);
      formData.append('password', sitterData.password);
      formData.append('ville', sitterData.ville);
      formData.append('siret', sitterData.siret);
      if (sitterData.photo) formData.append('photo', sitterData.photo);
      if (sitterData.bio.trim()) formData.append('bio', sitterData.bio.trim());
      if (sitterData.services.length > 0) formData.append('services', JSON.stringify(sitterData.services));
      if (sitterData.price_per_hour !== '') formData.append('price_per_hour', String(sitterData.price_per_hour));
      formData.append('is_available', sitterData.is_available ? 'true' : 'false');
      if (sitterData.experience_years !== '') formData.append('experience_years', String(sitterData.experience_years));

      const response = await apiPostMultipart('/api/register', formData);
      
      if (!response.ok) {
        const errorMessage = response.data?.error || 'Erreur lors de l\'inscription';
        setErrors({ submit: errorMessage });
        setIsSubmitting(false);
        return;
      }
      
      setShowSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'inscription';
      setErrors({ submit: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setErrors({});
    setShowSuccess(false);
  }, [accountType]);

  return {
    accountType,
    setAccountType,
    ownerData,
    setOwnerData,
    sitterData,
    setSitterData,
    errors,
    isSubmitting,
    showSuccess,
    handleOwnerSubmit,
    handleSitterSubmit,
  };
}
