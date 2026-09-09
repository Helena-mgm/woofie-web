'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { APP_CONFIG } from '@/infrastructure/config/constants';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    category: 'Général',
    question: 'Qu\'est-ce que Woofie ?',
    answer: 'Woofie est un réseau social dédié aux propriétaires de chiens. Notre plateforme permet de partager des moments avec votre toutou, d\'organiser des rencontres, de trouver des dog-sitters de confiance, et de créer une véritable communauté canine !',
  },
  {
    id: 2,
    category: 'Général',
    question: 'Est-ce que Woofie est gratuit ?',
    answer: 'Oui, l’inscription et les fonctionnalités actuellement disponibles sont gratuites.',
  },
  {
    id: 3,
    category: 'Compte',
    question: 'Comment créer un compte ?',
    answer: 'Cliquez sur "S\'inscrire" en haut de la page, renseignez vos informations (email, mot de passe, nom), puis ajoutez les informations de votre ou vos chiens. C\'est aussi simple que ça !',
  },
  {
    id: 4,
    category: 'Compte',
    question: 'Puis-je ajouter plusieurs chiens à mon profil ?',
    answer: 'Oui, vous pouvez enregistrer jusqu’à 10 chiens. Chaque chien dispose de son propre profil et de ses photos.',
  },
  {
    id: 5,
    category: 'Fonctionnalités',
    question: 'Comment organiser une rencontre canine ?',
    answer: 'Rendez-vous dans l\'onglet "Événements", cliquez sur "Créer un événement", choisissez le lieu, la date et l\'heure. Les membres de la communauté pourront s\'inscrire et vous recevrez des notifications.',
  },
  {
    id: 6,
    category: 'Fonctionnalités',
    question: 'Comment fonctionne la carte interactive ?',
    answer: 'La carte permet de rechercher des lieux adaptés aux chiens et d’afficher les événements géolocalisés. Des filtres facilitent la recherche par catégorie.',
  },
  {
    id: 7,
    category: 'Dog-sitting',
    question: 'Comment devenir dog-sitter sur Woofie ?',
    answer: 'Choisissez le profil Dog-sitter lors de l’inscription, puis renseignez votre SIRET, vos services, vos disponibilités, vos tarifs et votre expérience.',
  },
  {
    id: 8,
    category: 'Dog-sitting',
    question: 'Comment sont vérifiés les dog-sitters ?',
    answer: 'Le SIRET est contrôlé à l’inscription, puis un administrateur doit valider le profil avant sa publication dans l’annuaire.',
  },
  {
    id: 9,
    category: 'Sécurité',
    question: 'Mes données personnelles sont-elles protégées ?',
    answer: 'Les mots de passe sont hachés, l’accès aux données privées est contrôlé et vous pouvez exporter ou supprimer vos données depuis les paramètres du compte.',
  },
  {
    id: 10,
    category: 'Sécurité',
    question: 'Comment signaler un comportement inapproprié ?',
    answer: `Contactez ${APP_CONFIG.supportEmail} en indiquant le contenu concerné et les éléments utiles à son examen.`,
  },
  {
    id: 11,
    category: 'Technique',
    question: 'L\'application est-elle disponible sur mobile ?',
    answer: 'Oui, le site est conçu pour fonctionner sur mobile, tablette et ordinateur depuis un navigateur récent.',
  },
  {
    id: 12,
    category: 'Technique',
    question: 'Que faire si je rencontre un problème technique ?',
    answer: `Contactez notre support via la page "Support" ou envoyez un email à ${APP_CONFIG.supportEmail}. Notre équipe répond généralement en moins de 24h.`,
  },
];

export default function FAQPage() {
  const [openId, setOpenId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  const categories = ['Tous', ...Array.from(new Set(faqData.map(item => item.category)))];
  
  const filteredFAQ = selectedCategory === 'Tous' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-6"
          >
            <div className="text-8xl">❓</div>
          </motion.div>
          <h1 className="text-5xl sm:text-6xl font-bold text-[#8B4513] mb-6">
            Questions Fréquentes
          </h1>
          <p className="text-xl text-[#A0522D] max-w-3xl mx-auto">
            Trouvez rapidement des réponses à vos questions 🐾
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-full font-semibold transition-all ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-[#D2691E] to-[#8B4513] text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:shadow-md'
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredFAQ.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-orange-50 transition-colors"
              >
                <div className="flex-1">
                  <span className="inline-block px-3 py-1 bg-[#FFE4B5] text-[#8B4513] rounded-full text-xs font-semibold mb-2">
                    {item.category}
                  </span>
                  <h3 className="text-lg font-bold text-[#8B4513]">
                    {item.question}
                  </h3>
                </div>
                <motion.div
                  animate={{ rotate: openId === item.id ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-4 text-[#D2691E] text-2xl"
                >
                  ▼
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openId === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-gray-700 leading-relaxed">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-16 bg-gradient-to-r from-[#D2691E] to-[#8B4513] rounded-3xl p-12 text-center text-white shadow-2xl"
        >
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-3xl font-bold mb-4">
            Vous ne trouvez pas de réponse ?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Notre équipe est là pour vous aider !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="/support"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-[#D2691E] text-lg font-bold rounded-full shadow-xl hover:shadow-2xl transition-all"
            >
              Contacter le Support 🛟
            </motion.a>
            <motion.a
              href="/contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-[#8B4513] text-white text-lg font-bold rounded-full shadow-xl hover:shadow-2xl transition-all"
            >
              Nous Écrire ✉️
            </motion.a>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
