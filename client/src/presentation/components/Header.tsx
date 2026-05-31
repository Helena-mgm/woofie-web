'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/presentation/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '@/infrastructure/config/constants';

interface NavItem {
  name: string;
  href: string;
  icon?: string;
}

const appNavItems: NavItem[] = [
  { name: 'Accueil', href: '/', icon: '🏠' },
  { name: 'Communauté', href: '/community', icon: '📰' },
  { name: 'Carte', href: '/community/map', icon: '🗺️' },
  { name: 'Événements', href: '/events', icon: '📅' },
  { name: 'Messages', href: '/messages', icon: '💬' },
  { name: 'Services', href: '/services', icon: '🐕‍🦺' },
];

export function Header() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Fix hydration error: only render auth-dependent UI after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close desktop profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  // Handle mobile nav overlay
  useEffect(() => {
    if (!isMobileNavOpen) {
      document.body.style.removeProperty('overflow');
      return;
    }

    document.body.style.overflow = 'hidden';

    function handleClickOutside(event: MouseEvent) {
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target as Node)) {
        setIsMobileNavOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.removeProperty('overflow');
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileNavOpen]);

  if (!isMounted || loading) {
    return (null);
  }

  const navItems = appNavItems;
  const authenticatedUser = isAuthenticated && user ? user : null;
  const profileName = authenticatedUser
    ? authenticatedUser.prenom
      ? `${authenticatedUser.prenom} ${authenticatedUser.nom}`
      : authenticatedUser.nom
    : '';
  const profileRole = authenticatedUser
    ? authenticatedUser.type === 'owner'
      ? 'Propriétaire'
      : 'Dog-sitter'
    : '';
  const profileInitial = authenticatedUser?.nom?.charAt(0)?.toUpperCase() ?? '?';
  const profileHref = authenticatedUser ? `/profile/${authenticatedUser.id}` : '#';
  const avatarAlt = authenticatedUser?.nom ?? 'Profil Woofie';

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Barre principale avec logo, navigation et utilisateur */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo Woofie avec texte */}
            <Link href="/">
              <motion.div 
                className="flex items-center gap-3 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                  <Image 
                    src="/logo.png" 
                    alt="Woofie" 
                    width={80}
                    height={80}
                    className="object-contain"
                    style={{ width: 'auto', height: 'auto', objectFit: 'contain' }} // Ensure aspect ratio
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#8B4513]">Woofie</h1>
                  <p className="text-xs sm:text-sm text-[#A0522D]">Le réseau social des toutous</p>
                </div>
              </motion.div>
            </Link>

            {/* Navigation principale pour utilisateurs connectés (desktop) */}
            {isAuthenticated && (
              <nav className="hidden flex-1 items-center justify-center gap-3 lg:flex">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} className="group relative">
                      <motion.div
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className={`
                          relative inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition-all
                          ${isActive
                            ? 'border-transparent bg-[#8B4513] text-white shadow-[0_10px_24px_rgba(139,69,19,0.22)]'
                            : 'border-transparent bg-white/80 text-[#6B4A2B] hover:border-[#F8DCC0] hover:bg-[#FFF2E0] hover:text-[#8B4513]'
                          }
                        `}
                      >
                        <span className="text-lg leading-none">{item.icon}</span>
                        <span>{item.name}</span>
                        {isActive && (
                          <span className="absolute -bottom-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-[#8B4513]/80" />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Section droite - Connexion/Inscription ou Menu utilisateur */}
            {!isAuthenticated ? (
              <div className="hidden items-center gap-3 sm:flex">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-semibold text-[#8B4513] transition-colors hover:bg-[#FFF2E0] hover:text-[#5C3410]"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-[#8B4513] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(139,69,19,0.2)] transition-all hover:bg-[#A0522D]"
                >
                  Inscription
                </Link>
              </div>
            ) : (
              <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hidden items-center gap-3 hover:bg-gray-50 rounded-full pr-4 transition-colors sm:flex"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D2691E] to-[#8B4513] flex items-center justify-center text-white font-bold shadow-md overflow-hidden">
                  {authenticatedUser?.photo_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getImageUrl(authenticatedUser.photo_path)}
                      alt={avatarAlt}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{profileInitial}</span>
                  )}
                </div>

                {/* Name */}
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-semibold text-gray-800">
                    {profileName}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {profileRole}
                  </div>
                </div>

                {/* Arrow */}
                <svg
                  className={`w-4 h-4 text-gray-600 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden"
                  >
                    <div className="py-1">
                      <Link
                        href={profileHref}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-gray-700 font-medium">Mon profil</span>
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-gray-700 font-medium">Paramètres</span>
                      </Link>

                      <hr className="my-1 border-gray-200" />

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors w-full text-left"
                      >
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-red-600 font-medium">Déconnexion</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            )}
            {/* Mobile hamburger */}
            <div className="flex items-center gap-2 sm:hidden">
              {isAuthenticated ? (
                <button
                  onClick={() => setIsMobileNavOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-[#F1E5D4] bg-white/90 px-3 py-2 text-sm font-semibold text-[#8B4513] shadow-sm transition hover:bg-[#FFF2E0]"
                  aria-label="Ouvrir le menu mobile"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#D2691E] to-[#8B4513] text-white font-semibold">
                    {profileInitial}
                  </span>
                  <span className="text-sm">{profileName || 'Mon espace'}</span>
                  <svg className="h-4 w-4 text-[#8B4513]" viewBox="0 0 20 20" fill="none">
                    <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => setIsMobileNavOpen(true)}
                  className="rounded-full border border-[#F1E5D4] bg-white/90 p-2 text-[#8B4513] shadow-sm transition hover:bg-[#FFF2E0]"
                  aria-label="Ouvrir le menu mobile"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none">
                    <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile navigation drawer */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black"
            />
            <motion.aside
              ref={mobileNavRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed inset-y-0 right-0 z-50 flex w-80 max-w-[90vw] flex-col justify-between bg-white shadow-xl"
            >
              <div className="px-5 pt-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF2E0]">
                      <Image src="/logo.png" alt="Woofie" width={40} height={40} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#A0522D]">Menu Woofie</p>
                      <h2 className="text-lg font-bold text-[#3E2A1B]">Navigation</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileNavOpen(false)}
                    className="rounded-full p-2 text-[#8B4513] transition hover:bg-[#FFF2E0]"
                    aria-label="Fermer le menu mobile"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {isAuthenticated && (
                  <div className="mt-5 rounded-2xl border border-[#F1E5D4] bg-[#FFF9F1] p-4">
                    <Link
                      href={profileHref}
                      onClick={() => setIsMobileNavOpen(false)}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#D2691E] to-[#8B4513] text-lg font-semibold text-white">
                        {authenticatedUser?.photo_path ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getImageUrl(authenticatedUser.photo_path)}
                            alt={avatarAlt}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          profileInitial
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#3E2A1B]">{profileName}</p>
                        <p className="text-xs text-[#A0522D] capitalize">{profileRole}</p>
                      </div>
                    </Link>
                  </div>
                )}

                <nav className="mt-6 space-y-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileNavOpen(false)}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          isActive
                            ? 'border-[#8B4513] bg-[#8B4513] text-white shadow-md'
                            : 'border-[#F6E5D4] bg-white text-[#5C3410] hover:bg-[#FFF2E0]'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="text-lg">{item.icon}</span>
                          {item.name}
                        </span>
                        {isActive && (
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                            <path
                              d="M5 10h10M10 5l5 5-5 5"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-[#F6E5D4] bg-[#FFF8EF] px-5 py-4">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#8B4513] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#A0522D]"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M11.667 3.333V5a5 5 0 015 5 5 5 0 01-5 5v1.667a6.667 6.667 0 000-13.334zM9.167 2.5H5a2.5 2.5 0 00-2.5 2.5v10a2.5 2.5 0 002.5 2.5h4.167M6.667 10h10"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12.5 7.5L15 10l-2.5 2.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Déconnexion
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/login"
                      onClick={() => setIsMobileNavOpen(false)}
                      className="flex items-center justify-center rounded-full border border-[#F6E5D4] px-4 py-2 text-sm font-semibold text-[#8B4513] transition hover:bg-white"
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileNavOpen(false)}
                      className="flex items-center justify-center rounded-full bg-[#8B4513] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#A0522D]"
                    >
                      Inscription
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
