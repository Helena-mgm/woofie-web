import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'gradient';
}

export function Section({ 
  children, 
  className = '', 
  background = 'white' 
}: SectionProps) {
  const backgrounds = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    gradient: 'bg-gradient-to-br from-orange-50 via-white to-orange-50',
  };

  return (
    <section className={`py-12 md:py-20 ${backgrounds[background]} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {children}
      </div>
    </section>
  );
}
