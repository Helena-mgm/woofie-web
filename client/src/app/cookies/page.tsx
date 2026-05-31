'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function CookiesPage() {
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: false,
    marketing: false,
    preferences: false,
  });

  const handleToggle = (category: string) => {
    if (category === 'essential') return; // Can't disable essential cookies
    setPreferences({
      ...preferences,
      [category]: !preferences[category as keyof typeof preferences],
    });
  };

  const handleSavePreferences = () => {
    // Save preferences to localStorage or backend
    alert('Préférences enregistrées avec succès !');
  };

  const cookieTypes = [
    {
      id: 'essential',
      title: 'Cookies Essentiels',
      description: 'Nécessaires au fonctionnement du site. Ils permettent la navigation, l\'authentification et la sécurité. Ces cookies ne peuvent pas être désactivés.',
      icon: '🔐',
      required: true,
    },
    {
      id: 'analytics',
      title: 'Cookies Analytiques',
      description: 'Nous aident à comprendre comment vous utilisez notre site pour améliorer votre expérience. Ils collectent des données anonymes sur les pages visitées et le temps passé.',
      icon: '📊',
      required: false,
    },
    {
      id: 'marketing',
      title: 'Cookies Marketing',
      description: 'Utilisés pour personnaliser les publicités et mesurer l\'efficacité de nos campagnes. Ils permettent de vous montrer du contenu pertinent.',
      icon: '📢',
      required: false,
    },
    {
      id: 'preferences',
      title: 'Cookies de Préférences',
      description: 'Mémorisent vos choix (langue, région, thème) pour personnaliser votre expérience sur Woofie.',
      icon: '⚙️',
      required: false,
    },
  ];

  const sections = [
    {
      title: 'Qu\'est-ce qu\'un Cookie ?',
      content: 'Un cookie est un petit fichier texte stocké sur votre appareil lorsque vous visitez un site web. Les cookies permettent au site de mémoriser vos actions et préférences (comme la connexion, la langue, la taille de police) pendant une période donnée, afin que vous n\'ayez pas à les ressaisir à chaque visite.',
    },
    {
      title: 'Comment Utilisons-nous les Cookies ?',
      content: 'Woofie utilise des cookies pour améliorer votre expérience utilisateur, analyser le trafic, personnaliser le contenu, et assurer la sécurité de la plateforme. Nous utilisons à la fois des cookies de session (qui expirent à la fermeture du navigateur) et des cookies persistants (qui restent sur votre appareil).',
    },
    {
      title: 'Cookies de Tiers',
      content: 'Certains de nos partenaires (Google Analytics, réseaux sociaux, fournisseurs de publicité) peuvent également placer des cookies sur votre appareil. Ces cookies tiers sont soumis aux politiques de confidentialité respectives de ces partenaires.',
    },
    {
      title: 'Gestion des Cookies',
      content: 'Vous pouvez contrôler et gérer les cookies via les paramètres de votre navigateur. La plupart des navigateurs vous permettent de refuser ou d\'accepter les cookies, de supprimer les cookies existants, et de définir des préférences pour certains sites. Notez que la désactivation de certains cookies peut affecter la fonctionnalité du site.',
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-6"
          >
            <div className="text-8xl">🍪</div>
          </motion.div>
          <h1 className="text-5xl sm:text-6xl font-bold text-[#8B4513] mb-4">
            Politique des Cookies
          </h1>
          <p className="text-lg text-[#A0522D]">
            Dernière mise à jour : 13 octobre 2025
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-r from-[#D2691E] to-[#8B4513] text-white rounded-3xl p-8 mb-12 shadow-xl"
        >
          <p className="text-lg leading-relaxed">
            Cette politique explique comment Woofie utilise les cookies et technologies similaires 
            pour améliorer votre expérience sur notre plateforme. En continuant à utiliser Woofie, 
            vous consentez à l&apos;utilisation des cookies conformément à cette politique.
          </p>
        </motion.div>

        {/* Cookie Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-3xl p-8 mb-12 shadow-xl"
        >
          <h2 className="text-3xl font-bold text-[#8B4513] mb-6 text-center">
            Gérer vos Préférences
          </h2>
          <div className="space-y-4">
            {cookieTypes.map((type) => (
              <div
                key={type.id}
                className="border-2 border-gray-200 rounded-2xl p-6 hover:border-[#D2691E] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{type.icon}</span>
                      <h3 className="text-xl font-bold text-[#8B4513]">
                        {type.title}
                      </h3>
                      {type.required && (
                        <span className="px-3 py-1 bg-orange-100 text-[#D2691E] text-xs font-semibold rounded-full">
                          Requis
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => handleToggle(type.id)}
                      disabled={type.required}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                        preferences[type.id as keyof typeof preferences]
                          ? 'bg-[#D2691E]'
                          : 'bg-gray-300'
                      } ${type.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          preferences[type.id as keyof typeof preferences]
                            ? 'translate-x-9'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <motion.button
            onClick={handleSavePreferences}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-6 py-4 bg-gradient-to-r from-[#D2691E] to-[#8B4513] text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Enregistrer mes Préférences
          </motion.button>
        </motion.div>

        {/* Information Sections */}
        <div className="space-y-6 mb-12">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              <h2 className="text-2xl font-bold text-[#8B4513] mb-4">
                {section.title}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Browser Settings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-orange-100 rounded-3xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-[#8B4513] mb-4 text-center">
            Paramètres du Navigateur 🌐
          </h2>
          <p className="text-gray-700 mb-4 text-center">
            Liens rapides vers les guides de gestion des cookies :
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { name: 'Chrome', link: 'https://support.google.com/chrome/answer/95647' },
              { name: 'Firefox', link: 'https://support.mozilla.org/fr/kb/cookies' },
              { name: 'Safari', link: 'https://support.apple.com/fr-fr/HT201265' },
              { name: 'Edge', link: 'https://support.microsoft.com/fr-fr/microsoft-edge' },
            ].map((browser) => (
              <a
                key={browser.name}
                href={browser.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-white rounded-xl text-center hover:shadow-lg transition-shadow"
              >
                <span className="font-semibold text-[#D2691E]">{browser.name}</span>
              </a>
            ))}
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-3xl p-8 text-center shadow-xl"
        >
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-2xl font-bold text-[#8B4513] mb-4">
            Questions sur les Cookies ?
          </h2>
          <p className="text-gray-700 mb-6">
            Contactez notre équipe pour toute question relative aux cookies.
          </p>
          <motion.a
            href="/contact"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-8 py-3 bg-gradient-to-r from-[#D2691E] to-[#8B4513] text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Contactez-nous
          </motion.a>
        </motion.div>
      </div>
    </main>
  );
}
