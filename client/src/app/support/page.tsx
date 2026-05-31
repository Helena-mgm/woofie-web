'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: '',
    priority: 'normal',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simuler l'envoi
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
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
            <div className="text-8xl">🛟</div>
          </motion.div>
          <h1 className="text-5xl sm:text-6xl font-bold text-[#8B4513] mb-6">
            Centre de Support
          </h1>
          <p className="text-xl text-[#A0522D] max-w-3xl mx-auto">
            Notre équipe est là pour vous aider 24/7 🐾
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Quick Help Cards */}
          {[
            {
              icon: '📚',
              title: 'Base de Connaissances',
              description: 'Guides et tutoriels détaillés',
              link: '/faq',
            },
            {
              icon: '💬',
              title: 'Chat en Direct',
              description: 'Réponse en quelques minutes',
              link: '#',
            },
            {
              icon: '📧',
              title: 'Email Support',
              description: 'support@woofie.com',
              link: 'mailto:support@woofie.com',
            },
          ].map((card, index) => (
            <motion.a
              key={card.title}
              href={card.link}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl transition-all"
            >
              <div className="text-5xl mb-4">{card.icon}</div>
              <h3 className="text-xl font-bold text-[#8B4513] mb-2">
                {card.title}
              </h3>
              <p className="text-gray-600">
                {card.description}
              </p>
            </motion.a>
          ))}
        </div>

        {/* Support Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12"
        >
          <h2 className="text-3xl font-bold text-[#8B4513] mb-6 text-center">
            Envoyer une Demande de Support
          </h2>

          {submitted ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-7xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">
                Demande envoyée avec succès !
              </h3>
              <p className="text-gray-600">
                Notre équipe vous répondra dans les plus brefs délais.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Email */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D2691E] focus:outline-none transition-colors"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D2691E] focus:outline-none transition-colors"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              {/* Category and Priority */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D2691E] focus:outline-none transition-colors"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="technique">Problème technique</option>
                    <option value="compte">Compte & connexion</option>
                    <option value="paiement">Paiement & abonnement</option>
                    <option value="dogsitting">Dog-sitting</option>
                    <option value="securite">Sécurité & confidentialité</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priorité
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D2691E] focus:outline-none transition-colors"
                  >
                    <option value="low">Basse</option>
                    <option value="normal">Normale</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sujet *
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D2691E] focus:outline-none transition-colors"
                  placeholder="Résumé de votre problème"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description détaillée *
                </label>
                <textarea
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D2691E] focus:outline-none transition-colors resize-none"
                  placeholder="Décrivez votre problème en détail..."
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-[#D2691E] to-[#8B4513] text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                Envoyer la Demande 📤
              </motion.button>
            </form>
          )}
        </motion.div>

        {/* Response Times */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-12 grid md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Chat en direct', time: '< 5 min', icon: '⚡' },
            { label: 'Email', time: '< 24h', icon: '📧' },
            { label: 'Support standard', time: '1-2 jours', icon: '🕐' },
            { label: 'Taux de satisfaction', time: '98%', icon: '⭐' },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white rounded-xl p-4 text-center shadow-md"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="text-sm text-gray-600 mb-1">{item.label}</div>
              <div className="text-xl font-bold text-[#D2691E]">{item.time}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
