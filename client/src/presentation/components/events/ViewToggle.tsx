import type { ViewMode } from '@/shared/types/event';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

/**
 * Basculeur de vue (liste/calendrier)
 * Règle: composant simple < 30 lignes
 */
export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex gap-2 bg-white rounded-full p-1 shadow-md">
      <ViewButton
        mode="list"
        label="Liste"
        icon="📋"
        isActive={viewMode === 'list'}
        onClick={() => onViewChange('list')}
      />
      <ViewButton
        mode="calendar"
        label="Calendrier"
        icon="📅"
        isActive={viewMode === 'calendar'}
        onClick={() => onViewChange('calendar')}
      />
    </div>
  );
}

interface ViewButtonProps {
  mode: string;
  label: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
}

function ViewButton({ label, icon, isActive, onClick }: ViewButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full font-medium transition-all
        ${isActive ? 'bg-[#D2691E] text-white' : 'text-gray-600 hover:bg-gray-100'}
      `}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  );
}
