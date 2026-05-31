import Link from 'next/link';
import { AnimatedPawPrints } from '@/presentation/components/home/AnimatedPawPrints';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

/**
 * Layout partagé pour login/register
 * Règle: composant layout < 50 lignes
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center px-3 py-8 sm:p-6">
      <AnimatedPawPrints />
      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 space-y-3 text-center">
          <div className="text-5xl sm:text-6xl">🐕</div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{title}</h1>
          <p className="text-sm text-gray-600 sm:text-base">{subtitle}</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-[#F6E5D4] bg-white px-5 py-6 shadow-xl sm:rounded-3xl sm:px-8 sm:py-8">
          {children}
        </div>

        {/* Footer Link */}
        <div className="mt-8 text-center text-xs text-gray-600 sm:text-sm">
          {footerText}{' '}
          <Link href={footerLinkHref} className="text-[#D2691E] font-semibold hover:underline">
            {footerLinkText}
          </Link>
        </div>
      </div>
    </div>
  );
}
