'use client';

import { motion } from 'framer-motion';

interface PressArticle {
  id: number;
  title: string;
  outlet: string;
  date: string;
  excerpt: string;
  link: string;
  logo: string;
}

const pressArticles: PressArticle[] = [
  {
    id: 1,
    title: 'Woofie : Le réseau social qui révolutionne la vie des propriétaires de chiens',
    outlet: 'TechCrunch',
    date: '15 Septembre 2025',
    excerpt: 'Un projet étudiant devenu phénomène. Woofie connecte les propriétaires de chiens comme jamais auparavant.',
    link: '#',
    logo: '🚀',
  },
  {
    id: 2,
    title: 'Comment un projet d\'école est devenu la plateforme préférée des dog lovers',
    outlet: 'Le Monde Tech',
    date: '3 Août 2025',
    excerpt: 'Rencontre avec l\'équipe passionnée derrière Woofie, le réseau social canin qui fait sensation.',
    link: '#',
    logo: '📰',
  },
  {
    id: 3,
    title: 'Woofie lève 500K€ pour son expansion européenne',
    outlet: 'Les Échos',
    date: '20 Juillet 2025',
    excerpt: 'La startup française séduit les investisseurs avec sa vision innovante du social networking pour animaux.',
    link: '#',
    logo: '💰',
  },
  {
    id: 4,
    title: 'Top 10 des applications pour propriétaires de chiens en 2025',
    outlet: 'Wired',
    date: '5 Juin 2025',
    excerpt: 'Woofie se classe en tête grâce à son approche communautaire unique et ses fonctionnalités innovantes.',
    link: '#',
    logo: '🏆',
  },
  {
    id: 5,
    title: 'L\'histoire touchante de Woofie : de la salle de classe au succès',
    outlet: 'BFM Business',
    date: '12 Mai 2025',
    excerpt: 'Portrait d\'une équipe d\'étudiants qui a transformé sa passion en entreprise florissante.',
    link: '#',
    logo: '📺',
  },
  {
    id: 6,
    title: 'Woofie : Quand la tech rencontre l\'amour des chiens',
    outlet: 'L\'Express',
    date: '28 Avril 2025',
    excerpt: 'Analyse d\'un modèle économique basé sur la communauté et la passion partagée.',
    link: '#',
    logo: '📊',
  },
];

export default function PressPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero Section */}
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
            <div className="text-8xl">📰</div>
          </motion.div>
          <h1 className="text-5xl sm:text-6xl font-bold text-[#8B4513] mb-6">
            Woofie dans la Presse
          </h1>
          <p className="text-xl text-[#A0522D] max-w-3xl mx-auto">
            Découvrez ce que les médias disent de nous 🌟
          </p>
        </motion.div>

        {/* Press Kit Download */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-r from-[#D2691E] to-[#8B4513] rounded-3xl p-8 text-center text-white mb-12 shadow-2xl"
        >
          <h2 className="text-2xl font-bold mb-4">
            Journalistes & Médias 📸
          </h2>
          <p className="mb-6">
            Téléchargez notre kit presse complet avec logos, visuels et informations
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-white text-[#D2691E] font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            Télécharger le Kit Presse 📥
          </motion.button>
        </motion.div>

        {/* Articles Grid */}
        <div className="space-y-6">
          {pressArticles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden"
            >
              <div className="md:flex">
                {/* Logo Section */}
                <div className="md:w-1/4 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center p-8">
                  <div className="text-6xl">{article.logo}</div>
                </div>

                {/* Content Section */}
                <div className="md:w-3/4 p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-[#FFE4B5] text-[#8B4513] rounded-full text-sm font-semibold">
                      {article.outlet}
                    </span>
                    <span className="text-sm text-gray-500">{article.date}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#8B4513] mb-3 hover:text-[#D2691E] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {article.excerpt}
                  </p>
                  <motion.a
                    href={article.link}
                    whileHover={{ x: 5 }}
                    className="inline-flex items-center gap-2 text-[#D2691E] font-semibold hover:text-[#8B4513] transition-colors"
                  >
                    Lire l&apos;article
                    <span>→</span>
                  </motion.a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20"
        >
          <h2 className="text-4xl font-bold text-[#8B4513] text-center mb-12">
            Woofie en Chiffres 📊
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '📰', number: '50+', label: 'Articles de presse' },
              { icon: '🎙️', number: '15', label: 'Interviews' },
              { icon: '🏆', number: '8', label: 'Prix & distinctions' },
              { icon: '📺', number: '5', label: 'Passages TV' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl transition-shadow"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-[#D2691E] mb-1">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Press Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-16 bg-white rounded-3xl p-12 text-center shadow-xl"
        >
          <h2 className="text-3xl font-bold text-[#8B4513] mb-4">
            Contact Presse 📧
          </h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Pour toute demande d&apos;interview, d&apos;information ou de partenariat média
          </p>
          <div className="space-y-2">
            <p className="text-lg">
              <strong className="text-[#D2691E]">Email :</strong> presse@woofie.com
            </p>
            <p className="text-lg">
              <strong className="text-[#D2691E]">Téléphone :</strong> +33 1 23 45 67 89
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
