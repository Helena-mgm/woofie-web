'use client';
import { useAuth } from '@/presentation/hooks/useAuth';
import { AnimatedPawPrints } from '@/presentation/components/home/AnimatedPawPrints';
import { LoadingScreen } from '@/presentation/components/home/LoadingScreen';
import { HeroSection } from '@/presentation/components/home/HeroSection';
import { FeaturesSection } from '@/presentation/components/home/FeaturesSection';
import { CTASection } from '@/presentation/components/home/CTASection';

/**
 * Page d'accueil principale
 * Règle: < 50 lignes, composition de composants uniquement
 */
export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  const isAuthenticated = !!user;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6] relative overflow-hidden">
      <AnimatedPawPrints />
      <HeroSection isAuthenticated={isAuthenticated} />
      <FeaturesSection />
      <CTASection isAuthenticated={isAuthenticated} />
    </main>
  );
}
