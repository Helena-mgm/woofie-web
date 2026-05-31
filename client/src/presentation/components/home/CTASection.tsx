import Link from 'next/link';
import { motion } from 'framer-motion';

interface CTASectionProps {
  isAuthenticated: boolean;
}

/**
 * Section Call-to-Action
 * Règle: composant simple < 50 lignes
 */
export function CTASection({ isAuthenticated }: CTASectionProps) {
  const ctaText = isAuthenticated ? 'Rejoindre le Forum 🐾' : 'Créer mon compte 🐾';
  const ctaLink = isAuthenticated ? '/community' : '/register';

  return (
    <section className="py-12 sm:py-16 lg:py-20 relative z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-[#D2691E] to-[#8B4513] rounded-3xl p-8 sm:p-10 lg:p-12 shadow-2xl"
        >
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Prêt à rejoindre l&apos;aventure ?
          </h3>
          <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8">
            Des milliers de propriétaires et leurs chiens vous attendent déjà !
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href={ctaLink}
              className="inline-block px-8 sm:px-10 py-3 sm:py-4 bg-white text-[#8B4513] font-bold rounded-full hover:bg-[#FFE4B5] transition-all shadow-xl text-base sm:text-lg"
            >
              {ctaText}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
