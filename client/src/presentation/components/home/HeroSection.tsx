import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  isAuthenticated: boolean;
}

/**
 * Section Hero de la page d'accueil
 * Règle: < 150 lignes, une seule responsabilité
 */
export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 relative z-10">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Texte */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <HeroBadge />
          <HeroTitle />
          <HeroDescription />
          <HeroActions isAuthenticated={isAuthenticated} />
        </motion.div>

        {/* Image */}
        <HeroImage />
      </div>
    </section>
  );
}

function HeroBadge() {
  return (
    <div className="mb-4 sm:mb-6">
      <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-[#FFE4B5] text-[#8B4513] rounded-full text-xs sm:text-sm font-semibold mb-4">
        🐕 Nouveau sur Woofie ? Bienvenue dans la meute !
      </span>
    </div>
  );
}

function HeroTitle() {
  return (
    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#8B4513] mb-4 sm:mb-6 leading-tight">
      Connectez votre chien<br />
      <span className="text-[#D2691E]">à la meilleure communauté canine</span>
    </h2>
  );
}

function HeroDescription() {
  return (
    <p className="text-base sm:text-lg lg:text-xl text-[#8B4513]/80 mb-6 sm:mb-8 leading-relaxed">
      Partagez vos victoires, organisez des sorties au parc et trouvez des services de confiance —
      tout dans un espace pensé pour vous et votre compagnon à quatre pattes.
    </p>
  );
}

function HeroActions({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (isAuthenticated) {
    return <AuthenticatedActions />;
  }
  return <GuestActions />;
}

function AuthenticatedActions() {
    const buttons = [
    { href: '/community', label: '📰 Fil d\'actualité', variant: 'gradient' as const },
    { href: '/map', label: '🗺️ Carte', variant: 'solid' as const },
    { href: '/messages', label: '💬 Messages', variant: 'solid' as const },
    { href: '/services', label: '🐕‍🦺 Services', variant: 'solid' as const },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {buttons.map((button) => (
        <ActionButton key={button.href} {...button} />
      ))}
    </div>
  );
}

function GuestActions() {
  return (
    <div className="flex flex-wrap gap-4">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Link
          href="/register"
          className="px-6 sm:px-8 py-3 sm:py-4 bg-[#D2691E] text-white font-bold rounded-full hover:bg-[#8B4513] transition-all shadow-xl text-base sm:text-lg inline-flex items-center gap-2"
        >
          Rejoindre Woofie →
        </Link>
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Link
          href="/community"
          className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-[#8B4513] font-bold rounded-full hover:bg-[#FFF5E6] transition-all shadow-md text-base sm:text-lg inline-flex items-center gap-2"
        >
          Découvrir la communauté
        </Link>
      </motion.div>
    </div>
  );
}

function ActionButton({ 
  href, 
  label, 
  variant 
}: { 
  href: string; 
  label: string; 
  variant: 'gradient' | 'solid' 
}) {
  const baseClass = 'px-6 py-3 font-semibold rounded-full transition-all shadow-lg flex items-center gap-2';
  const variantClass = variant === 'gradient'
    ? 'bg-gradient-to-r from-[#D2691E] to-[#8B4513] text-white hover:shadow-xl'
    : 'bg-[#D2691E] text-white hover:bg-[#8B4513]';

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Link href={href} className={`${baseClass} ${variantClass}`}>
        {label}
      </Link>
    </motion.div>
  );
}

function HeroImage() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative"
    >
      <div className="relative rounded-3xl overflow-hidden shadow-2xl">
        <Image
          src="/pet_dog_sleep.png"
          alt="Chien adorable"
          width={800}
          height={661}
          className="w-full h-auto"
          sizes="(min-width: 1024px) 600px, (min-width: 768px) 50vw, 90vw"
          priority
        />
        <FloatingBadge />
      </div>
    </motion.div>
  );
}

function FloatingBadge() {
  return (
    <motion.div
      className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/90 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <span className="text-2xl">💤</span>
      <span className="ml-2 font-semibold text-[#8B4513]">Petite sieste au soleil</span>
    </motion.div>
  );
}
