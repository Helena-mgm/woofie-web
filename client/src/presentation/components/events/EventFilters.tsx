import type { EventCategory } from '@/shared/types/event';

interface EventFiltersProps {
  selectedCategory: EventCategory;
  onCategoryChange: (category: EventCategory) => void;
}

/**
 * Filtres pour les événements
 * Règle: composant simple < 50 lignes
 */
export function EventFilters({ selectedCategory, onCategoryChange }: EventFiltersProps) {
  const categories: { value: EventCategory; label: string; icon: string }[] = [
    { value: 'all', label: 'Tous', icon: '🎯' },
    { value: 'Rencontre', label: 'Rencontres', icon: '👥' },
    { value: 'Formation', label: 'Formations', icon: '🎓' },
    { value: 'Compétition', label: 'Compétitions', icon: '🏆' },
    { value: 'Charity', label: 'Caritatif', icon: '❤️' },
  ];

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onCategoryChange(cat.value)}
          className={`
            px-4 py-2 rounded-full font-medium transition-all
            ${selectedCategory === cat.value
              ? 'bg-[#D2691E] text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-100'
            }
          `}
        >
          <span className="mr-2">{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}
