"use client";

import Image from 'next/image';

export function LoadingScreen() {
  const walkingDogGif = '/images/walking-dog.gif';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5E6D3]">
      <Image
        src={walkingDogGif}
        alt="Chargement..."
        width={256}
        height={256}
        className="animate-bounce"
        priority
        style={{ width: '256px', height: '256px', objectFit: 'contain' }}
      />
    </div>
  );
}
