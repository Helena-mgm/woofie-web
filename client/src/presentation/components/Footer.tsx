'use client';

import Link from 'next/link';
import Image from 'next/image';
// framer-motion retiré du layout → CSS transitions pures

export function Footer() {
  const currentYear = new Date().getFullYear();


  const footerLinks = {
    company: [
      { name: 'À Propos', href: '/about' },
      { name: 'Équipe', href: '/team' },
      { name: 'Presse', href: '/press' },
    ],
    support: [
      { name: 'FAQ', href: '/faq' },
      { name: 'Support', href: '/support' },
      { name: 'Contact', href: '/contact' },
    ],
    legal: [
      { name: 'Confidentialité', href: '/privacy' },
      { name: 'Conditions', href: '/terms' },
      { name: 'Cookies', href: '/cookies' },
    ],
  };

  return (
    <footer className="bg-gradient-to-b from-[#8B4513] to-[#654321] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <Image
                    src="/logo.png"
                    alt="Woofie"
                    width={48}
                    height={48}
                    className="object-contain"
                    priority // Ajout de la priorité pour améliorer les performances
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <span className="text-2xl font-bold">Woofie</span>
              </div>
            </Link>
            <p className="text-sm text-gray-300 mb-4">
              Le réseau social des toutous 🐾
            </p>
            <div className="flex gap-3">
              {[
                { icon: '📘', name: 'Facebook', href: '#' },
                { icon: '📷', name: 'Instagram', href: '#' },
                { icon: '🐦', name: 'Twitter', href: '#' },
                { icon: '💼', name: 'LinkedIn', href: '#' },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 hover:scale-110 hover:-translate-y-0.5 rounded-full flex items-center justify-center text-xl transition-all duration-150"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Entreprise</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Aide</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Légal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-white/20 pt-8 mb-8">
          <div className="max-w-md mx-auto text-center">
            <h3 className="font-bold text-xl mb-2">
              Restez Informé 📬
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              Recevez les dernières nouvelles et événements Woofie
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Votre email"
                className="flex-1 px-4 py-2 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#D2691E]"
              />
              <button
                className="px-6 py-2 bg-[#D2691E] hover:bg-[#FF8C00] hover:scale-105 active:scale-95 rounded-full font-semibold transition-all duration-150"
              >
                S&apos;abonner
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-300">
            <p>
              © {currentYear} Woofie. Tous droits réservés. Fait avec ❤️ et 🐕
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Conditions
              </Link>
              <Link href="/cookies" className="hover:text-white transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
