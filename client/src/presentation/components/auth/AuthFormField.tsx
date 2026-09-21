interface AuthFormFieldProps {
  label: string;
  children: React.ReactNode;
}

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
