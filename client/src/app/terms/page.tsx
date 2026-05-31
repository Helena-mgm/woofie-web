'use client';

import { motion } from 'framer-motion';

export default function TermsPage() {
  const sections = [
    {
      title: '1. Acceptation des Conditions',
      content: `En accédant et en utilisant Woofie, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme. Nous nous réservons le droit de modifier ces conditions à tout moment.`,
    },
    {
      title: '2. Description du Service',
      content: `Woofie est un réseau social dédié aux propriétaires de chiens. Nous fournissons une plateforme permettant de partager du contenu, d'organiser des rencontres, de trouver des services de dog-sitting, et de créer une communauté canine. Nous nous réservons le droit de modifier, suspendre ou interrompre tout ou partie du service à tout moment.`,
    },
    {
      title: '3. Inscription et Compte',
      content: `Pour utiliser Woofie, vous devez créer un compte en fournissant des informations exactes et complètes. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées sous votre compte. Vous devez avoir au moins 16 ans pour créer un compte.`,
    },
    {
      title: '4. Règles de Conduite',
      content: `Vous vous engagez à ne pas publier de contenu illégal, offensant, diffamatoire, menaçant, pornographique ou violant les droits d'autrui. Vous ne devez pas usurper l'identité d'autrui, spammer, ou tenter de pirater la plateforme. Woofie se réserve le droit de supprimer tout contenu inapproprié et de suspendre ou fermer les comptes contrevenants.`,
    },
    {
      title: '5. Propriété Intellectuelle',
      content: `Le contenu, les marques, logos et autres éléments de Woofie sont protégés par les droits de propriété intellectuelle. Vous conservez la propriété du contenu que vous publiez, mais vous accordez à Woofie une licence mondiale, non exclusive et gratuite pour utiliser, reproduire et distribuer ce contenu dans le cadre de nos services.`,
    },
    {
      title: '6. Services de Dog-sitting',
      content: `Woofie facilite la mise en relation entre propriétaires et dog-sitters, mais n'est pas partie aux transactions. Nous ne garantissons pas la qualité des services fournis. Les utilisateurs sont responsables de vérifier les références et de conclure leurs propres arrangements. Woofie ne peut être tenu responsable des litiges entre utilisateurs.`,
    },
    {
      title: '7. Limitation de Responsabilité',
      content: `Woofie est fourni "tel quel" sans garantie d'aucune sorte. Nous ne sommes pas responsables des dommages directs, indirects, accessoires ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser nos services. Notre responsabilité totale ne dépassera pas le montant que vous avez payé pour nos services au cours des 12 derniers mois.`,
    },
    {
      title: '8. Résiliation',
      content: `Vous pouvez fermer votre compte à tout moment depuis les paramètres. Nous nous réservons le droit de suspendre ou de résilier votre compte si vous violez ces conditions, sans préavis ni responsabilité. En cas de résiliation, certaines dispositions de ces conditions survivront, notamment celles relatives à la propriété intellectuelle et à la limitation de responsabilité.`,
    },
    {
      title: '9. Droit Applicable',
      content: `Ces conditions sont régies par le droit français. Tout litige relatif à ces conditions sera soumis à la compétence exclusive des tribunaux de Paris, France. Si une disposition de ces conditions est jugée invalide, les autres dispositions resteront en vigueur.`,
    },
    {
      title: '10. Contact et Réclamations',
      content: `Pour toute question concernant ces conditions d'utilisation, contactez-nous à legal@woofie.com. Si vous avez une réclamation, nous nous engageons à y répondre dans les meilleurs délais et à trouver une solution amiable.`,
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
            <div className="text-8xl">📜</div>
          </motion.div>
          <h1 className="text-5xl sm:text-6xl font-bold text-[#8B4513] mb-4">
            Conditions d&apos;Utilisation
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
            Bienvenue sur Woofie ! Ces conditions d&apos;utilisation régissent votre accès et votre 
            utilisation de notre plateforme. Veuillez les lire attentivement. En utilisant Woofie, 
            vous acceptez d&apos;être lié par ces conditions.
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

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-12 bg-orange-100 border-l-4 border-[#D2691E] rounded-2xl p-8"
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚠️</div>
            <div>
              <h3 className="text-xl font-bold text-[#8B4513] mb-2">
                Important
              </h3>
              <p className="text-gray-700 leading-relaxed">
                En continuant à utiliser Woofie, vous confirmez avoir lu, compris et accepté 
                ces conditions d&apos;utilisation dans leur intégralité. Si vous avez des questions, 
                n&apos;hésitez pas à nous contacter.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-12 bg-white rounded-3xl p-8 text-center shadow-xl"
        >
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-[#8B4513] mb-4">
            Questions Légales ?
          </h2>
          <p className="text-gray-700 mb-6">
            Notre équipe juridique est à votre disposition pour toute clarification.
          </p>
          <motion.a
            href="mailto:legal@woofie.com"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-8 py-3 bg-gradient-to-r from-[#D2691E] to-[#8B4513] text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            legal@woofie.com
          </motion.a>
        </motion.div>
      </div>
    </main>
  );
}
