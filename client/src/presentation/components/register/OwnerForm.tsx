import { Input, PhoneInput, FileUpload, DogInfoInput, Button } from '@/presentation/components/ui';
import { PasswordInput } from '@/presentation/components/auth/PasswordInput';
import type { OwnerRegisterFormData } from '@/types';

interface OwnerFormProps {
  data: OwnerRegisterFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onDataChange: (data: Partial<OwnerRegisterFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onEmailFocus?: () => void;
  onEmailBlur?: () => void;
  onPasswordFocus?: () => void;
  onPasswordBlur?: () => void;
  onTogglePassword?: (show: boolean) => void;
}

/**
 * Formulaire d'inscription Propriétaire
 * Règle: composant formulaire < 150 lignes
 */
export function OwnerForm({ 
  data, 
  errors, 
  isSubmitting, 
  onDataChange, 
  onSubmit,
  onEmailFocus,
  onEmailBlur,
  onPasswordFocus,
  onPasswordBlur,
  onTogglePassword
}: OwnerFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormSection title="Informations personnelles">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nom"
            name="nom"
            value={data.nom}
            onChange={(e) => onDataChange({ nom: e.target.value })}
            error={errors.nom}
            placeholder="Ex: Dupont"
            required
          />

          <Input
            label="Prénom"
            name="prenom"
            value={data.prenom}
            onChange={(e) => onDataChange({ prenom: e.target.value })}
            error={errors.prenom}
            placeholder="Ex: Martin"
            required
          />
        </div>

        <Input
          label="Email"
          name="email"
          type="email"
          value={data.email}
          onChange={(e) => onDataChange({ email: e.target.value })}
          onFocus={onEmailFocus}
          onBlur={onEmailBlur}
          error={errors.email}
          placeholder="exemple@email.com"
          required
        />

        <PhoneInput
          label="Téléphone"
          name="telephone"
          value={data.telephone}
          onChange={(e) => onDataChange({ telephone: e.target.value })}
          error={errors.telephone}
          placeholder="06 12 34 56 78"
          required
        />

        <PasswordInput
          name="password"
          value={data.password}
          onChange={(e) => onDataChange({ password: e.target.value })}
          onFocus={onPasswordFocus}
          onBlur={onPasswordBlur}
          onToggleVisibility={onTogglePassword}
          error={errors.password}
          placeholder="Min. 8 caractères"
          required
        />
      </FormSection>

      <FormSection title="Localisation">
        <Input
          label="Ville"
          name="ville"
          value={data.ville}
          onChange={(e) => onDataChange({ ville: e.target.value })}
          error={errors.ville}
          placeholder="Ex: Paris, Lyon..."
          required
        />
      </FormSection>

      <FormSection title="Mes chiens">
        <DogInfoInput
          label="Informations de vos chiens"
          value={data.dogs}
          onChange={(dogs) => onDataChange({ dogs })}
          error={errors.dogs}
          helperText="Ajoutez les informations complètes de chaque chien (ICAD, nom, sexe, race, date de naissance, photo)"
          required
        />
      </FormSection>

      <FormSection title="Photo de profil (optionnel)">
        <FileUpload
          label="Photo de profil"
          accept="image/*"
          onChange={(file) => onDataChange({ photo: file })}
          error={errors.photo}
        />
        <p className="text-sm text-gray-500 mt-1">JPG, PNG - Max 5MB</p>
      </FormSection>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Inscription en cours...' : "S'inscrire 🐾"}
      </Button>
    </form>
  );
}

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 sm:text-xl">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
