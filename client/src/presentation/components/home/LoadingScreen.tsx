"use client";

import Image from 'next/image';

/**
 * Composant de chargement avec animation de chien qui marche
 */
export function LoadingScreen() {
  // Use local public asset (relative path) so Next.js serves/optimizes it and
  // avoid cross-host fetches that delay LCP in Docker/nginx setups.
  const walkingDogGif = '/images/walking-dog.gif';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5E6D3]">
      <Image
        src={walkingDogGif}
        alt="Chargement..."
        width={256}
        height={256}
        className="animate-bounce"
        priority // Ajout de la priorité pour LCP
        style={{ width: '256px', height: '256px', objectFit: 'contain' }}
      />
    </div>
  );
}
