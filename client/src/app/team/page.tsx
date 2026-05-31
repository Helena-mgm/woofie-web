'use client';

import { motion } from 'framer-motion';

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  avatar: string;
  emoji: string;
  dogName?: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Helena Mougammadaly',
    role: 'Fondatrice & Développeuse Full-Stack',
    bio: 'Passionnée par la technologie et les chiens, Héléna a transformé un projet d\'école en plateforme communautaire.',
    avatar: '👩‍💼',
    emoji: '🚀',
    dogName: '',
  }
];

export default function TeamPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
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
            <div className="text-8xl">👥</div>
          </motion.div>
          <h1 className="text-5xl sm:text-6xl font-bold text-[#8B4513] mb-6">
            Notre Équipe
          </h1>
          <p className="text-xl text-[#A0522D] max-w-3xl mx-auto">
            Des passionnés qui travaillent chaque jour pour rendre Woofie extraordinaire 🐾
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all"
            >
              {/* Card Header with Gradient */}
              <div className="bg-gradient-to-br from-[#D2691E] to-[#8B4513] p-8 text-center relative">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center text-6xl shadow-lg mb-4"
                >
                  {member.avatar}
                </motion.div>
                <div className="absolute top-4 right-4 text-3xl">
                  {member.emoji}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <h3 className="text-2xl font-bold text-[#8B4513] mb-2">
                  {member.name}
                </h3>
                <p className="text-[#D2691E] font-semibold mb-4">
                  {member.role}
                </p>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {member.bio}
                </p>
                {member.dogName && (
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <span className="text-2xl">🐕</span>
                    <span className="text-sm text-gray-600">
                      Meilleur ami : <strong className="text-[#D2691E]">{member.dogName}</strong>
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20"
        >
          <h2 className="text-4xl font-bold text-[#8B4513] text-center mb-12">
            Nos Valeurs 💎
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '❤️',
                title: 'Passion',
                description: 'Nous aimons ce que nous faisons et ça se voit dans chaque détail.',
              },
              {
                icon: '🤝',
                title: 'Communauté',
                description: 'Ensemble, nous créons un espace bienveillant pour tous les propriétaires.',
              },
              {
                icon: '🚀',
                title: 'Innovation',
                description: 'Toujours à l\'affût des nouvelles idées pour améliorer l\'expérience.',
              },
            ].map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-shadow"
              >
                <div className="text-5xl mb-4">{value.icon}</div>
                <h3 className="text-2xl font-bold text-[#8B4513] mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Join Us Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20 bg-gradient-to-r from-[#D2691E] to-[#8B4513] rounded-3xl p-12 text-center text-white shadow-2xl"
        >
          <h2 className="text-4xl font-bold mb-4">
            Envie de rejoindre l&apos;aventure ? 🌟
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Nous recherchons constamment des talents passionnés pour agrandir notre meute !
          </p>
          <motion.a
            href="/contact"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-10 py-4 bg-white text-[#D2691E] text-lg font-bold rounded-full shadow-xl hover:shadow-2xl transition-all"
          >
            Contactez-nous 📧
          </motion.a>
        </motion.div>
      </div>
    </main>
  );
}
