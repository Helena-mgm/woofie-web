'use client';

import { motion } from 'framer-motion';

export default function PrivacyPage() {
  const sections = [
    {
      title: '1. Collecte des Données',
      content: `Nous collectons les informations que vous nous fournissez lors de l'inscription : nom, prénom, adresse email, numéro de téléphone, informations sur vos chiens (nom, race, âge, photos). Nous collectons également des données d'utilisation telles que votre adresse IP, type de navigateur, pages visitées et durée de visite pour améliorer nos services.`,
    },
    {
      title: '2. Utilisation des Données',
      content: `Vos données sont utilisées pour fournir et améliorer nos services, personnaliser votre expérience, communiquer avec vous, assurer la sécurité de la plateforme, et respecter nos obligations légales. Nous ne vendons jamais vos données personnelles à des tiers.`,
    },
    {
      title: '3. Partage des Informations',
      content: `Nous ne partageons vos informations personnelles qu'avec votre consentement explicite, avec des prestataires de services qui nous aident à exploiter la plateforme (hébergement, analyse), ou si requis par la loi. Tous nos partenaires sont tenus de respecter la confidentialité de vos données.`,
    },
    {
      title: '4. Cookies et Technologies Similaires',
      content: `Nous utilisons des cookies pour améliorer votre expérience utilisateur, analyser le trafic, et personnaliser le contenu. Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur. Certains cookies sont essentiels au fonctionnement du site.`,
    },
    {
      title: '5. Sécurité des Données',
      content: `Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction. Cela inclut le cryptage, les pare-feu, et des audits de sécurité réguliers.`,
    },
    {
      title: '6. Vos Droits',
      content: `Conformément au RGPD, vous avez le droit d'accéder à vos données, de les rectifier, de les supprimer, de limiter leur traitement, de vous opposer à leur traitement, et de demander leur portabilité. Pour exercer ces droits, contactez-nous à privacy@woofie.com.`,
    },
    {
      title: '7. Conservation des Données',
      content: `Nous conservons vos données personnelles aussi longtemps que votre compte est actif ou que nécessaire pour vous fournir nos services. Si vous supprimez votre compte, vos données seront supprimées dans les 30 jours, sauf si nous sommes légalement tenus de les conserver plus longtemps.`,
    },
    {
      title: '8. Protection des Mineurs',
      content: `Woofie est destiné aux personnes âgées de 16 ans et plus. Nous ne collectons pas sciemment d'informations personnelles de mineurs de moins de 16 ans. Si vous pensez qu'un mineur a fourni des informations, contactez-nous immédiatement.`,
    },
    {
      title: '9. Modifications de la Politique',
      content: `Nous pouvons mettre à jour cette politique de confidentialité de temps en temps. Nous vous informerons de tout changement significatif par email ou via une notification sur la plateforme. La date de la dernière mise à jour est indiquée en haut de cette page.`,
    },
    {
      title: '10. Contact',
      content: `Pour toute question concernant cette politique de confidentialité ou le traitement de vos données personnelles, contactez notre Délégué à la Protection des Données à privacy@woofie.com ou par courrier postal à : Woofie, 42 Rue des Toutous, 75001 Paris, France.`,
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
            <div className="text-8xl">🔒</div>
          </motion.div>
          <h1 className="text-5xl sm:text-6xl font-bold text-[#8B4513] mb-4">
            Politique de Confidentialité
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
            Chez Woofie, nous prenons votre vie privée très au sérieux. Cette politique explique 
            comment nous collectons, utilisons, protégeons et partageons vos informations personnelles. 
            En utilisant Woofie, vous acceptez les pratiques décrites dans cette politique.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
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

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-12 bg-white rounded-3xl p-8 text-center shadow-xl"
        >
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-2xl font-bold text-[#8B4513] mb-4">
            Des Questions ?
          </h2>
          <p className="text-gray-700 mb-6">
            Notre équipe est là pour répondre à toutes vos questions sur la confidentialité.
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
