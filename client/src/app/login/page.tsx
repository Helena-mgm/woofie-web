'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/presentation/components/ui';
import { AuthLayout } from '@/presentation/components/auth/AuthLayout';
import { PasswordInput } from '@/presentation/components/auth/PasswordInput';
import { AnimatedDog } from '@/presentation/components/AnimatedDog';
import { useLogin } from '@/presentation/hooks/useLogin';
import { tokenManager } from '@/shared/lib/api';

/**
 * Login Page - Ultra simplified
 * Rule: < 70 lines, composition only
 * Redirects to dashboard if already logged in
 */
export default function LoginPage() {
  const router = useRouter();
  const {
    identifier, setIdentifier,
    password, setPassword,
    errors, isSubmitting,
    isEmailFocused, setIsEmailFocused,
    isPasswordFocused, setIsPasswordFocused,
    showPassword, setShowPassword,
    handleSubmit
  } = useLogin();

  // Redirect if already logged in
  useEffect(() => {
    if (tokenManager.exists()) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <AuthLayout
      title="Connexion 🐾"
      subtitle="Ravis de vous revoir !"
      footerText="Pas encore de compte ?"
      footerLinkText="S'inscrire"
      footerLinkHref="/register"
    >
      <div className="flex justify-center mb-6">
        <AnimatedDog
          isEmailFocused={isEmailFocused}
          isPasswordFocused={isPasswordFocused}
          showPassword={showPassword}
          error={errors.submit || ''}
          success=""
          width={160}
          height={160}
        />
      </div>

      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email ou Téléphone"
          name="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          onFocus={() => setIsEmailFocused(true)}
          onBlur={() => setIsEmailFocused(false)}
          error={errors.identifier}
          placeholder="email@exemple.com ou 06 12 34 56 78"
          required
        />

        <PasswordInput
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setIsPasswordFocused(true)}
          onBlur={() => setIsPasswordFocused(false)}
          onToggleVisibility={setShowPassword}
          error={errors.password}
          required
        />

        <div className="text-right">
          <a href="#" className="text-sm text-[#D2691E] hover:underline">
            Mot de passe oublié ?
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Connexion...' : 'Se connecter'}
        </Button>
      </form>
    </AuthLayout>
  );
}
