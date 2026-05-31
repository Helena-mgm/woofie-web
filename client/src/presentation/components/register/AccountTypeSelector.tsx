import { motion } from 'framer-motion';

interface AccountTypeSelectorProps {
  accountType: 'owner' | 'sitter';
  onTypeChange: (type: 'owner' | 'sitter') => void;
}

/**
 * Sélecteur de type de compte
 * Règle: composant simple < 50 lignes
 */
export function AccountTypeSelector({ accountType, onTypeChange }: AccountTypeSelectorProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:gap-4">
      <AccountTypeButton
        type="owner"
        icon="🐕"
        title="Propriétaire"
        description="J'ai un ou plusieurs chiens"
        isActive={accountType === 'owner'}
        onClick={() => onTypeChange('owner')}
      />
      <AccountTypeButton
        type="sitter"
        icon="🐕‍🦺"
        title="Dog-sitter"
        description="Je propose mes services"
        isActive={accountType === 'sitter'}
        onClick={() => onTypeChange('sitter')}
      />
    </div>
  );
}

interface AccountTypeButtonProps {
  type: string;
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}

function AccountTypeButton({ icon, title, description, isActive, onClick }: AccountTypeButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full rounded-2xl border-2 px-6 py-6 text-left transition-all sm:flex-1 sm:px-7 sm:py-7
        ${
          isActive
            ? 'border-[#D2691E] bg-gradient-to-br from-orange-50 to-white shadow-lg'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
    >
      <div className="mb-3 text-3xl sm:text-4xl">{icon}</div>
      <h3 className="mb-1 text-lg font-bold text-gray-900 sm:text-xl">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </motion.button>
  );
}
