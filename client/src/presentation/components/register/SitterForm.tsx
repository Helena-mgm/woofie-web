import { Input, PhoneInput, FileUpload, SiretInput, Button } from '@/presentation/components/ui';
import { PasswordInput } from '@/presentation/components/auth/PasswordInput';
import type { SitterRegisterFormData } from '@/types';
import { Textarea } from '@/shared/ui/textarea';
import { availableServices } from '@/infrastructure/data/services';
import { LIMITS } from '@/infrastructure/config/constants';

interface SitterFormProps {
  data: SitterRegisterFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onDataChange: (data: Partial<SitterRegisterFormData>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onEmailFocus?: () => void;
  onEmailBlur?: () => void;
  onPasswordFocus?: () => void;
  onPasswordBlur?: () => void;
  onTogglePassword?: (show: boolean) => void;
}

/**
 * Formulaire d'inscription Dog-sitter
 * Règle: composant formulaire < 150 lignes
 */
export function SitterForm({ 
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
}: SitterFormProps) {
  const toggleService = (service: string) => {
    const hasService = data.services.includes(service);
    const updated = hasService
      ? data.services.filter((item: string) => item !== service)
      : [...data.services, service];
    onDataChange({ services: updated });
  };

  const priceValue = data.price_per_hour === '' ? '' : String(data.price_per_hour);
  const experienceValue = data.experience_years === '' ? '' : String(data.experience_years);

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

      <FormSection title="Informations professionnelles">
        <SiretInput
          label="Numéro SIRET"
          name="siret"
          value={data.siret}
          onChange={(e) => onDataChange({ siret: e.target.value })}
          error={errors.siret}
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          14 chiffres - Requis pour exercer en tant que professionnel
        </p>
      </FormSection>

      <FormSection title="Présentation & services">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Présentation <span className="text-red-500">*</span>
          </label>
          <Textarea
            rows={4}
            maxLength={LIMITS.maxBioLength}
            placeholder="Décrivez votre expérience, le type de chiens que vous acceptez, votre environnement d'accueil..."
            value={data.bio}
            onChange={(e) => onDataChange({ bio: e.target.value })}
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {errors.bio ? (
                <span className="text-red-600">{errors.bio}</span>
              ) : (
                <>Présentez-vous en quelques phrases (max {LIMITS.maxBioLength} caractères)</>
              )}
            </span>
            <span>{data.bio.length}/{LIMITS.maxBioLength}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Services proposés *</p>
          <div className="flex flex-wrap gap-2">
            {availableServices.map((service) => {
              const selected = data.services.includes(service);
              return (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  aria-pressed={selected}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    selected
                      ? 'bg-[#D2691E] text-white shadow'
                      : 'bg-[#FFF5E6] text-[#8B4513] hover:bg-[#FFE4C4]'
                  }`}
                >
                {service}
              </button>
            );
          })}
        </div>
        {errors.services && <p className="text-xs text-red-600">{errors.services}</p>}
      </div>
      </FormSection>

      <FormSection title="Tarifs & disponibilité">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Tarif horaire (€)"
            type="number"
            min={0}
            step={1}
            value={priceValue}
            onChange={(e) => {
              const value = e.target.value;
              onDataChange({ price_per_hour: value === '' ? '' : Number(value) });
            }}
            error={errors.price_per_hour}
            placeholder="15"
            required
          />
          <Input
            label="Années d'expérience"
            type="number"
            min={0}
            step={1}
            value={experienceValue}
            onChange={(e) => {
              const value = e.target.value;
              onDataChange({ experience_years: value === '' ? '' : Number(value) });
            }}
            error={errors.experience_years}
            placeholder="3"
          />
        </div>

        <div className="rounded-2xl border border-[#E7D9C7] bg-[#FFF7EB] px-4 py-3">
          <label className="flex items-center gap-3 text-sm font-medium text-[#8B4513]">
            <input
              type="checkbox"
              checked={data.is_available}
              onChange={(e) => onDataChange({ is_available: e.target.checked })}
              className="h-4 w-4 rounded border-[#D2691E] text-[#D2691E] focus:ring-[#D2691E]"
            />
            Disponible pour de nouvelles demandes
          </label>
          <p className="mt-1 text-xs text-[#8B4513]/70">
            Décochez cette option si vous ne prenez plus de nouvelles gardes pour le moment.
          </p>
        </div>
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
        {isSubmitting ? 'Inscription en cours...' : "S'inscrire comme Dog-sitter 🐕‍🦺"}
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
