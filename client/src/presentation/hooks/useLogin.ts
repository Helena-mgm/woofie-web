import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, tokenManager } from '@/shared/lib/api-v2';
import { VALIDATION } from '@/infrastructure/config/constants';
import type { AuthResponse } from '@/types';

/**
 * Custom hook for login logic
 * Rule: < 60 lines, single responsibility
 */
export function useLogin() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!identifier) {
      newErrors.identifier = 'Email ou téléphone requis';
    } else {
      const isEmail = VALIDATION.email.pattern.test(identifier);
      const phoneClean = identifier.replace(/\s/g, '');
      const isPhone = VALIDATION.phone.pattern.test(phoneClean);
      if (!isEmail && !isPhone) newErrors.identifier = 'Email ou téléphone invalide';
    }

    if (!password) {
      newErrors.password = 'Mot de passe requis';
    } else if (password.length < VALIDATION.password.minLength) {
      newErrors.password = VALIDATION.password.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await apiPost('/api/login', {
        identifier: identifier.replace(/\s/g, ''),
        password,
      });

      if (!response.ok) {
        const payload = response.data as {
          errors?: Record<string, string>;
          error?: string;
        } | null;

        const fieldErrors = payload?.errors ?? {};
        const submitError = payload?.error;
        const fallbackError =
          response.status === 401
            ? 'Identifiants incorrects'
            : response.status >= 500
            ? 'Service momentanément indisponible. Réessayez un peu plus tard.'
            : 'Impossible de se connecter';
        const summaryError =
          submitError ??
          fieldErrors.identifier ??
          fieldErrors.password ??
          fieldErrors.email ??
          fallbackError;

        setErrors({
          ...fieldErrors,
          ...(summaryError ? { submit: summaryError } : {}),
        });
        return;
      }

      const authData = response.data as AuthResponse;

      if (authData?.token) {
        tokenManager.save(authData.token);
        // Notify other components that auth state changed
        window.dispatchEvent(new Event('auth-change'));
        router.push('/community');
      } else {
        throw new Error(authData?.error || 'Erreur de connexion');
      }
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Erreur de connexion' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    identifier, setIdentifier,
    password, setPassword,
    errors, isSubmitting,
    isEmailFocused, setIsEmailFocused,
    isPasswordFocused, setIsPasswordFocused,
    showPassword, setShowPassword,
    handleSubmit
  };
}
