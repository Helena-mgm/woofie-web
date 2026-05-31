import { motion } from 'framer-motion';

/**
 * Configuration des features
 * Règle: Données séparées de la logique
 */
interface Feature {
  icon: string;
  title: string;
  description: string;
  delay: number;
}

const features: Feature[] = [
  {
    icon: '🐕',
    title: 'Profils personnalisés',
    description: 'Créez un profil complet pour chaque chien : photos, race, âge, caractère, préférences de jeu et bien plus encore !',
    delay: 0.1,
  },
  {
    icon: '📍',
    title: 'Rencontres locales',
    description: 'Trouvez des compagnons de promenade près de chez vous grâce à notre carte interactive. Organisez des rencontres et créez des liens !',
    delay: 0.2,
  },
  {
    icon: '💬',
    title: 'Forum actif',
    description: 'Échangez conseils, astuces et expériences avec une communauté bienveillante de passionnés de chiens.',
    delay: 0.3,
  },
  {
    icon: '📸',
    title: 'Galerie photos',
    description: 'Partagez les plus beaux moments de votre chien avec la communauté. Likes, commentaires et partages garantis !',
    delay: 0.4,
  },
  {
    icon: '🎉',
    title: 'Événements',
    description: 'Participez à des événements canins locaux : concours, expositions, journées de sensibilisation et bien plus !',
    delay: 0.5,
  },
  {
    icon: '⭐',
    title: 'Services & Avis',
    description: 'Trouvez les meilleurs vétérinaires, toiletteurs et dog-sitters près de chez vous. Consultez les avis de la communauté !',
    delay: 0.6,
  },
];

/**
 * Section des fonctionnalités principales
 * Règle: < 100 lignes, responsabilité unique
 */
export function FeaturesSection() {
  return (
    <section className="bg-white/50 backdrop-blur-sm py-12 sm:py-16 lg:py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <FeatureHeader />
        <FeatureGrid />
      </div>
    </section>
  );
}

function FeatureHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="text-center mb-10 sm:mb-12 lg:mb-16"
    >
      <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#8B4513] mb-3 sm:mb-4">
        Pourquoi rejoindre Woofie ?
      </h3>
      <p className="text-base sm:text-lg lg:text-xl text-[#8B4513]/70">
        Découvrez tout ce que notre communauté a à offrir
      </p>
    </motion.div>
  );
}

function FeatureGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {features.map((feature) => (
        <FeatureCard key={feature.title} {...feature} />
      ))}
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: Feature) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -10 }}
      className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all"
    >
      <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">{icon}</div>
      <h4 className="text-xl sm:text-2xl font-bold text-[#8B4513] mb-2 sm:mb-3">
        {title}
      </h4>
      <p className="text-sm sm:text-base text-[#8B4513]/70 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
