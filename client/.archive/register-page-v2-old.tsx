'use client'

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatedDog } from '@/components/AnimatedDog';
import { Button, Input, PasswordInput, ErrorAlert, SuccessAlert } from '@/components/ui';
import { useForm } from '@/hooks/useForm';
import { useFocusState } from '@/hooks/useFocusState';
import { usePasswordToggle } from '@/hooks/usePasswordToggle';
import { apiPost } from '@/lib/api-v2';
import { VALIDATION } from '@/config/constants';
import type { RegisterFormData, AuthResponse } from '@/types';

/**
 * Page d'inscription optimisée
 * - Utilise des hooks personnalisés pour la réutilisabilité
 * - Composants UI modulaires
 * - useMemo pour les calculs dérivés
 * - Callbacks optimisés pour éviter les re-renders
 */
export default function RegisterPage() {
  const router = useRouter();
  const { handleFocus, handleBlur, isFocused } = useFocusState();
  const { showPassword, togglePassword, icon, ariaLabel } = usePasswordToggle();

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFieldError
  } = useForm<RegisterFormData>({
    initialValues: {
      email: '',
      password: '',
      type: 'owner'
    },
    validate: (values) => {
      const errors: Partial<Record<keyof RegisterFormData, string>> = {};
      
      if (!values.email) {
        errors.email = 'Email requis';
      } else if (!VALIDATION.email.pattern.test(values.email)) {
        errors.email = VALIDATION.email.message;
      }
      
      if (!values.password) {
        errors.password = 'Mot de passe requis';
      } else if (values.password.length < VALIDATION.password.minLength) {
        errors.password = VALIDATION.password.message;
      }

      if (!['owner', 'sitter'].includes(values.type)) {
        errors.type = 'Type invalide';
      }
      
      return errors;
    },
    onSubmit: async (values) => {
      try {
        const response = await apiPost('/api/register', values);
        
        if (response.ok) {
          // Redirection après 2 secondes
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else {
          const authData = response.data as AuthResponse;
          throw new Error(authData?.error || 'Erreur d\'inscription');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur d\'inscription';
        setFieldError('email', message);
      }
    }
  });

  // Calculs dérivés mémoïsés
  const animationState = useMemo(() => ({
    isPasswordFocused: isFocused('password'),
    isEmailFocused: isFocused('email'),
    showPassword,
    error: errors.email || errors.password || errors.type || '',
    success: isSubmitting && !errors.email && !errors.password ? "Inscription réussie — vous pouvez maintenant vous connecter" : '',
  }), [isFocused, showPassword, errors, isSubmitting]);

  const showSuccess = isSubmitting && !errors.email && !errors.password && !errors.type;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6] px-4 py-8 overflow-hidden">
      <div className="w-full max-w-md">
        {/* Lien retour */}
        <div className="mb-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-[#8B4513] hover:text-[#D2691E] font-semibold text-sm"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
        
        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl">
          {/* Dog Animation */}
          <div className="flex justify-center mb-8">
            <AnimatedDog {...animationState} width={200} height={200} />
          </div>

          {/* Titre */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-[#8B4513] text-center">
            🐶 Inscription
          </h1>

          {/* Alertes */}
          {errors.email && <ErrorAlert message={errors.email} />}
          {showSuccess && <SuccessAlert message="Inscription réussie — vous pouvez maintenant vous connecter" />}

          {/* Champ Email */}
          <div className="mb-4">
            <Input
              name="email"
              type="email"
              label="Email"
              value={values.email}
              onChange={handleChange}
              onFocus={() => handleFocus('email')}
              onBlur={() => handleBlur('email')}
              placeholder="votre@email.com"
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>

          {/* Champ Password */}
          <div className="mb-4">
            <PasswordInput
              name="password"
              label="Mot de passe"
              value={values.password}
              onChange={handleChange}
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
              placeholder="Mot de passe"
              disabled={isSubmitting}
              showPassword={showPassword}
              onTogglePassword={togglePassword}
              toggleIcon={icon}
              toggleAriaLabel={ariaLabel}
              autoComplete="new-password"
            />
          </div>

          {/* Champ Type */}
          <div className="mb-6">
            <label className="block mb-1">
              <span className="text-[#8B4513] font-semibold text-sm sm:text-base">
                Vous êtes
              </span>
            </label>
            <select 
              name="type"
              className="block w-full border-2 border-[#D2691E]/30 focus:border-[#D2691E] rounded-lg p-2.5 sm:p-3 transition text-sm sm:text-base bg-white text-black"
              value={values.type}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="owner">🏠 Propriétaire</option>
              <option value="sitter">🐕 Dog sitter</option>
            </select>
          </div>

          {/* Bouton Submit */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            isLoading={isSubmitting}
          >
            S&apos;inscrire
          </Button>

          {/* Lien connexion */}
          <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-[#8B4513]/70">
            Déjà un compte ?{' '}
            <Link 
              href="/login" 
              className="text-[#D2691E] hover:text-[#8B4513] font-semibold hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
