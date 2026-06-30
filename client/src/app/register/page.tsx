'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AccountTypeSelector } from '@/presentation/components/register/AccountTypeSelector';
import { OwnerForm } from '@/presentation/components/register/OwnerForm';
import { SitterForm } from '@/presentation/components/register/SitterForm';
import { AnimatedDog } from '@/presentation/components/AnimatedDog';
import { AnimatedPawPrints } from '@/presentation/components/home/AnimatedPawPrints';
import { useRegister } from '@/presentation/hooks/useRegister';
import { tokenManager } from '@/shared/lib/api';

/**
 * Register Page - Ultra simplified
 * Rule: < 90 lines, composition only
 * Redirects to dashboard if already logged in
 */
export default function RegisterPage() {
  const router = useRouter();
  const {
    accountType, setAccountType,
    ownerData, setOwnerData,
    sitterData, setSitterData,
    errors, isSubmitting, showSuccess,
    handleOwnerSubmit, handleSitterSubmit,
  } = useRegister();

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (tokenManager.exists()) {
        router.push('/community');
    }
  }, [router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center px-3 py-10 sm:px-6 sm:py-12">
      <AnimatedPawPrints />
      <div className="relative z-10 w-full max-w-2xl">
        <div className="mb-8 space-y-4 text-center">
          <div className="mb-4 flex justify-center">
            <AnimatedDog
              isEmailFocused={isEmailFocused}
              isPasswordFocused={isPasswordFocused}
              showPassword={showPassword}
              error={errors.submit || ''}
              success={showSuccess ? 'success' : ''}
              width={160}
              height={160}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Rejoignez Woofie ! 🐾</h1>
          <p className="text-sm text-gray-600 sm:text-base">Créez votre compte en quelques minutes</p>
        </div>

        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            🎉 Inscription réussie ! Redirection vers la connexion...
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {errors.submit}
          </div>
        )}

        <div className="rounded-2xl border border-[#F6E5D4] bg-white px-5 py-6 shadow-xl sm:rounded-3xl sm:px-8 sm:py-8">
          <AccountTypeSelector accountType={accountType} onTypeChange={setAccountType} />

          {accountType === 'owner' ? (
            <OwnerForm
              data={ownerData}
              errors={errors}
              isSubmitting={isSubmitting}
              onDataChange={(partial) => setOwnerData({ ...ownerData, ...partial })}
              onSubmit={handleOwnerSubmit}
              onEmailFocus={() => setIsEmailFocused(true)}
              onEmailBlur={() => setIsEmailFocused(false)}
              onPasswordFocus={() => setIsPasswordFocused(true)}
              onPasswordBlur={() => setIsPasswordFocused(false)}
              onTogglePassword={setShowPassword}
            />
          ) : (
            <SitterForm
              data={sitterData}
              errors={errors}
              isSubmitting={isSubmitting}
              onDataChange={(partial) => setSitterData({ ...sitterData, ...partial })}
              onSubmit={handleSitterSubmit}
              onEmailFocus={() => setIsEmailFocused(true)}
              onEmailBlur={() => setIsEmailFocused(false)}
              onPasswordFocus={() => setIsPasswordFocused(true)}
              onPasswordBlur={() => setIsPasswordFocused(false)}
              onTogglePassword={setShowPassword}
            />
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            Déjà inscrit ?{' '}
            <Link href="/login" className="text-[#D2691E] font-semibold hover:underline">
              Se connecter
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          En vous inscrivant, vous acceptez nos{' '}
          <Link href="/terms" className="underline hover:text-gray-700">Conditions d&apos;utilisation</Link>
          {' '}et notre{' '}
          <Link href="/privacy" className="underline hover:text-gray-700">Politique de confidentialité</Link>
        </p>
      </div>
    </div>
  );
}
