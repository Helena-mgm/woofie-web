'use client';
import { useAuth } from '@/presentation/hooks/useAuth';
import { AnimatedPawPrints } from '@/presentation/components/home/AnimatedPawPrints';
import { HeroSection } from '@/presentation/components/home/HeroSection';
import { FeaturesSection } from '@/presentation/components/home/FeaturesSection';
import { CTASection } from '@/presentation/components/home/CTASection';

export default function Home() {
  const { user } = useAuth();
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
