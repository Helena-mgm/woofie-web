import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/presentation/components/ui';

interface PasswordInputProps {
  label?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  onToggleVisibility?: (show: boolean) => void;
}

/**
 * Password Input with animated emoji toggle (🔒/🔓)
 * Reusable component for login/register forms
 * Rule: < 40 lines, single responsibility
 */
export function PasswordInput({
  label = 'Mot de passe',
  name,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  placeholder = 'Votre mot de passe',
  required = false,
  onToggleVisibility
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleToggle = () => {
    const newState = !showPassword;
    setShowPassword(newState);
    onToggleVisibility?.(newState);
  };

  return (
    <div className="relative">
      <Input
        label={label}
        name={name}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        error={error}
        placeholder={placeholder}
        required={required}
      />
      <motion.button
        type="button"
        onClick={handleToggle}
        className="absolute right-3 top-9 text-2xl focus:outline-none"
        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        animate={{ rotate: showPassword ? [0, -10, 10, 0] : 0 }}
        transition={{ duration: 0.3 }}
      >
        {showPassword ? '🔓' : '🔒'}
      </motion.button>
    </div>
  );
}
