'use client';

import { motion } from 'framer-motion';

export default function AboutPage() {
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
            <div className="text-8xl">🐕</div>
          </motion.div>
          <h1 className="text-5xl sm:text-6xl font-bold text-[#8B4513] mb-6">
            L&apos;Histoire de Woofie
          </h1>
          <p className="text-xl text-[#A0522D] max-w-3xl mx-auto">
            Woofie est né comme projet de fin d&apos;année scolaire, imaginé et développé par des étudiants passionnés 🐾
          </p>
        </motion.div>

        {/* Story Timeline */}
        <div className="space-y-12">
          {/* Chapter 1 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#D2691E] to-[#8B4513] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                1
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#8B4513]">
                Les Débuts 📚
              </h2>
            </div>
            <div className="ml-20 space-y-4 text-lg text-gray-700">
              <p>
                Tout a commencé en 2024, dans une salle de classe ordinaire. Un projet d&apos;école 
                comme tant d&apos;autres... ou presque. L&apos;objectif ? Créer une application web innovante.
              </p>
              <p>
                Mais voilà, notre équipe avait une passion commune : <strong className="text-[#D2691E]">les chiens</strong> ! 
                Ces boules de poils qui nous font craquer chaque jour. Alors pourquoi ne pas créer 
                quelque chose pour eux et leurs propriétaires ?
              </p>
            </div>
          </motion.div>

          {/* Chapter 2 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-3xl shadow-2xl p-8 sm:p-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#8B4513] to-[#654321] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                2
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#8B4513]">
                La Passion Prend Vie 💡
              </h2>
            </div>
            <div className="ml-20 space-y-4 text-lg text-gray-700">
              <p>
                Les premières lignes de code ont été écrites avec enthousiasme. Chaque membre 
                de l&apos;équipe apportait son grain de sel, ses idées, ses anecdotes de vie avec 
                son propre chien.
              </p>
              <p>
                <em className="text-[#D2691E] font-semibold">
                  &quot;Et si on pouvait organiser des rencontres canines ?&quot;
                </em>
                <br />
                <em className="text-[#D2691E] font-semibold">
                  &quot;Et si les propriétaires pouvaient partager leurs moments de joie ?&quot;
                </em>
                <br />
                <em className="text-[#D2691E] font-semibold">
                  &quot;Et si on créait une vraie communauté ?&quot;
                </em>
              </p>
              <p>
                Les idées fusaient, et le projet prenait une ampleur inattendue. Ce n&apos;était plus 
                juste un devoir à rendre, c&apos;était devenu une <strong>mission</strong>.
              </p>
            </div>
          </motion.div>

          {/* Chapter 3 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#D2691E] to-[#FF8C00] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                3
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#8B4513]">
                De Projet à Passion 🚀
              </h2>
            </div>
            <div className="ml-20 space-y-4 text-lg text-gray-700">
              <p>
                Les nuits blanches se sont multipliées, mais pas par obligation. Par <strong>passion</strong>. 
                Chaque fonctionnalité ajoutée était une petite victoire. Chaque bug corrigé, un défi relevé.
              </p>
              <p>
                Le projet d&apos;école est devenu un projet de vie. Les professeurs étaient impressionnés, 
                mais nous, on pensait déjà à l&apos;après : <em>&quot;Et si on continuait ?&quot;</em>
              </p>
              <div className="bg-gradient-to-r from-[#FFE4B5] to-[#FFDAB9] p-6 rounded-2xl border-l-4 border-[#D2691E]">
                <p className="text-xl font-semibold text-[#8B4513]">
                  🎯 Notre Vision
                </p>
                <p className="mt-2">
                  Créer le réseau social que nous aurions aimé avoir en tant que propriétaires de chiens. 
                  Un endroit où partager, s&apos;entraider, et célébrer nos compagnons à quatre pattes.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Chapter 4 */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-[#D2691E] to-[#8B4513] rounded-3xl shadow-2xl p-8 sm:p-12 text-white"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#D2691E] text-2xl font-bold">
                4
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold">
                Aujourd&apos;hui et Demain 🌟
              </h2>
            </div>
            <div className="ml-20 space-y-4 text-lg">
              <p>
                Woofie n&apos;est plus un simple projet d&apos;école. C&apos;est une plateforme vivante, 
                en constante évolution, portée par une équipe passionnée et une communauté grandissante.
              </p>
              <p>
                Chaque jour, des propriétaires partagent leurs moments de bonheur, organisent des 
                rencontres, trouvent des dog-sitters de confiance, et créent des liens authentiques.
              </p>
              <p className="text-2xl font-bold mt-6">
                🐕 Parce que nos toutous méritent le meilleur !
              </p>
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { icon: '👥', number: '1,234', label: 'Membres' },
            { icon: '🐕', number: '2,567', label: 'Toutous' },
            { icon: '📸', number: '8,901', label: 'Photos' },
            { icon: '❤️', number: '45,678', label: 'J\'aime' },
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
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-2xl text-[#8B4513] mb-8">
            Prêt à rejoindre l&apos;aventure Woofie ? 🐾
          </p>
          <motion.a
            href="/register"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-12 py-4 bg-gradient-to-r from-[#D2691E] to-[#8B4513] text-white text-xl font-bold rounded-full shadow-2xl hover:shadow-3xl transition-all"
          >
            Rejoindre la Communauté 🚀
          </motion.a>
        </motion.div>
      </div>
    </main>
  );
}
