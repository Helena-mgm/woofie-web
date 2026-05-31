interface AuthFormFieldProps {
  label: string;
  children: React.ReactNode;
}

/**
 * Conteneur de champ de formulaire d'authentification
 * Règle: composant simple < 20 lignes
 */
export function AuthFormField({ label, children }: AuthFormFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
