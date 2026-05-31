import React from 'react';
import Image from 'next/image';

// Use relative path - nginx will serve it
const walkingDogGif = '/images/walking-dog.gif';

const Loading: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
      <Image
        src={walkingDogGif}
        alt="Chargement..."
        width={128}
        height={128}
        priority
        style={{ width: '128px', height: '128px', objectFit: 'contain' }}
      />
    </div>
  );
};

export default Loading;
