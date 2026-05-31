import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  align?: 'left' | 'center';
}

export function SectionHeader({ 
  title, 
  subtitle, 
  icon, 
  align = 'center' 
}: SectionHeaderProps) {
  const alignmentClass = align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={`mb-12 ${alignmentClass}`}>
      {icon && (
        <div className={`text-6xl mb-4 ${align === 'center' ? 'flex justify-center' : ''}`}>
          {icon}
        </div>
      )}
      <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
