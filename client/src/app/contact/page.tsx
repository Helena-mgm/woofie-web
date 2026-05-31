'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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
            <div className="text-8xl">📧</div>
          </motion.div>
          <h1 className="text-5xl sm:text-6xl font-bold text-[#8B4513] mb-6">
            Contactez-Nous
          </h1>
          <p className="text-xl text-[#A0522D] max-w-3xl mx-auto">
            Une question ? Une suggestion ? N&apos;hésitez pas à nous écrire ! 🐾
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-bold text-[#8B4513] mb-6">
                Parlons de Woofie ! 🐕
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Que vous soyez un utilisateur curieux, un partenaire potentiel, ou simplement 
                quelqu&apos;un qui aime les chiens, nous serions ravis d&apos;échanger avec vous !
              </p>
            </div>

            {/* Contact Cards */}
            <div className="space-y-4">
              {[
                {
                  icon: '📧',
                  title: 'Email',
                  content: 'contact@woofie.com',
                  link: 'mailto:contact@woofie.com',
                },
                {
                  icon: '📞',
                  title: 'Téléphone',
                  content: '+33 1 23 45 67 89',
                  link: 'tel:+33123456789',
                },
                {
                  icon: '📍',
                  title: 'Adresse',
                  content: '42 Rue des Toutous, 75001 Paris, France',
                  link: 'https://maps.google.com',
                },
                {
                  icon: '🕐',
                  title: 'Horaires',
                  content: 'Lundi - Vendredi : 9h - 18h',
                  link: null,
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{item.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#8B4513] mb-1">{item.title}</h3>
                      {item.link ? (
                        <a
                          href={item.link}
                          className="text-gray-700 hover:text-[#D2691E] transition-colors"
                        >
                          {item.content}
                        </a>
                      ) : (
                        <p className="text-gray-700">{item.content}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-xl font-bold text-[#8B4513] mb-4">
                Suivez-nous sur les réseaux 🌐
              </h3>
              <div className="flex gap-4">
                {[
                  { icon: '📘', name: 'Facebook', color: 'bg-blue-500' },
                  { icon: '📷', name: 'Instagram', color: 'bg-pink-500' },
                  { icon: '🐦', name: 'Twitter', color: 'bg-sky-500' },
                  { icon: '💼', name: 'LinkedIn', color: 'bg-blue-700' },
                ].map((social) => (
                  <motion.a
                    key={social.name}
                    href="#"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-14 h-14 ${social.color} rounded-full flex items-center justify-center text-2xl shadow-lg hover:shadow-xl transition-all`}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-3xl shadow-2xl p-8"
          >
            <h2 className="text-2xl font-bold text-[#8B4513] mb-6">
              Envoyez-nous un Message
            </h2>

            {submitted ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-12"
              >
                <div className="text-7xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">
                  Message envoyé !
                </h3>
                <p className="text-gray-600">
                  Nous vous répondrons très bientôt.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D2691E] focus:outline-none transition-colors"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

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
                    placeholder="De quoi souhaitez-vous parler ?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D2691E] focus:outline-none transition-colors resize-none"
                    placeholder="Votre message..."
                  />
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-[#D2691E] to-[#8B4513] text-white text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  Envoyer le Message 🚀
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>

        {/* Map Section (Placeholder) */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-16 bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="h-96 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-xl text-gray-600">
                Carte interactive bientôt disponible
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
