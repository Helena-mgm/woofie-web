import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateIcadNumber } from '@/shared/lib/icad-validator';
import { LIMITS } from '@/infrastructure/config/constants';
import { Input, Button, BreedSelect } from '@/presentation/components/ui';
import { formatAgeLabel, formatLongFrenchDate, formatShortDate } from '@/shared/lib/format';
import type { DogInfo } from '@/types';

export interface DogInfoInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  value: DogInfo[]; // Liste des chiens
  onChange: (dogs: DogInfo[]) => void;
  required?: boolean;
  disabled?: boolean;
  maxItems?: number;
}

/**
 * Composant pour gérer plusieurs chiens avec informations complètes
 * Chaque chien nécessite: ICAD, nom, sexe, race, date de naissance, photo
 */
export const DogInfoInput = memo<DogInfoInputProps>(function DogInfoInput({
  label = 'Informations de vos chiens',
  error,
  helperText,
  value = [],
  onChange,
  required,
  disabled,
  maxItems = LIMITS.maxIcadNumbers,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<DogInfo>({
    icadNumber: '',
    nom: '',
    sexe: '',
    race: '',
    dateNaissance: '',
    photos: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      icadNumber: '',
      nom: '',
      sexe: '',
      race: '',
      dateNaissance: '',
      photos: [],
    });
    setFormErrors({});
    setEditIndex(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Valider ICAD
    if (!formData.icadNumber.trim()) {
      errors.icadNumber = 'Numéro ICAD requis';
    } else {
      const validation = validateIcadNumber(formData.icadNumber);
      if (!validation.isValid) {
        errors.icadNumber = validation.message || 'Numéro ICAD invalide';
      } else {
        // Vérifier si ICAD existe déjà (sauf si on édite)
        const existingIndex = value.findIndex(d => d.icadNumber === formData.icadNumber);
        if (existingIndex !== -1 && existingIndex !== editIndex) {
          errors.icadNumber = 'Ce numéro ICAD existe déjà';
        }
      }
    }

    // Valider nom
    if (!formData.nom.trim()) {
      errors.nom = 'Nom du chien requis';
    }

    // Valider sexe
    if (!formData.sexe) {
      errors.sexe = 'Sexe requis';
    }

    // Valider race
    if (!formData.race.trim()) {
      errors.race = 'Race requise';
    }

    // Valider date de naissance
    if (!formData.dateNaissance) {
      errors.dateNaissance = 'Date de naissance requise';
    } else {
      const birthDate = new Date(formData.dateNaissance);
      const today = new Date();
      if (birthDate > today) {
        errors.dateNaissance = 'La date ne peut pas être dans le futur';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = () => {
    if (!validateForm()) return;

    if (editIndex !== null) {
      // Mode édition
      const newDogs = [...value];
      newDogs[editIndex] = formData;
      onChange(newDogs);
    } else {
      // Mode ajout
      onChange([...value, formData]);
    }

    resetForm();
    setShowForm(false);
  };

  const handleEdit = (index: number) => {
    setFormData({ ...value[index] });
    setEditIndex(index);
    setShowForm(true);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const canAddMore = value.length < maxItems;

  return (
    <div className="space-y-4">
      {/* Label et bouton ajouter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {!showForm && canAddMore && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowForm(true)}
            disabled={disabled}
            className="w-full sm:w-auto"
          >
            + Ajouter un chien
          </Button>
        )}
      </div>

      {/* Message d'erreur global */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Helper text */}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}

      {/* Liste des chiens ajoutés */}
      <AnimatePresence>
        {value.length > 0 && (
          <div className="space-y-3">
            {value.map((dog, index) => (
              <motion.div
                key={`${dog.icadNumber}-${index}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-[#FF6B35] transition-colors"
              >
                {/* Photos - affiche la première */}
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden relative">
                  {dog.photos && dog.photos.length > 0 ? (
                    <>
                      <img
                        src={URL.createObjectURL(dog.photos[0])}
                        alt={dog.nom}
                        className="w-full h-full object-cover"
                      />
                      {dog.photos.length > 1 && (
                        <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white text-xs px-1 rounded-tl">
                          +{dog.photos.length - 1}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      🐕
                    </div>
                  )}
                </div>

                {/* Informations */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{dog.nom}</h4>
                    <span className="text-xl">{dog.sexe === 'male' ? '♂️' : '♀️'}</span>
                  </div>
                  <p className="text-sm text-gray-600">{dog.race}</p>
                  {dog.dateNaissance && (
                    <p className="text-xs text-gray-500">
                      {(() => {
                        const age = formatAgeLabel(dog.dateNaissance);
                        const short = formatShortDate(dog.dateNaissance);
                        const long = formatLongFrenchDate(dog.dateNaissance);
                        return `Né le ${short} (${long})${age ? ` · ${age}` : ''}`;
                      })()}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">ICAD: {dog.icadNumber}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(index)}
                    disabled={disabled}
                    className="p-2 text-gray-600 hover:text-[#FF6B35] hover:bg-orange-50 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    disabled={disabled}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Formulaire d'ajout/édition */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-[#FF6B35] rounded-xl space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">
                {editIndex !== null ? 'Modifier le chien' : 'Ajouter un chien'}
              </h4>

              {/* Numéro ICAD avec explication */}
              <div>
                <Input
                  label="Numéro ICAD"
                  name="icadNumber"
                  value={formData.icadNumber}
                  onChange={(e) => setFormData({ ...formData, icadNumber: e.target.value })}
                  error={formErrors.icadNumber}
                  placeholder="250269123456789 (15 chiffres)"
                  required
                  disabled={disabled}
                />
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 font-semibold mb-1">
                    🔍 Qu&apos;est-ce que le numéro ICAD ?
                  </p>
                  <p className="text-xs text-blue-800 mb-2">
                    Le numéro ICAD est l&apos;identifiant unique de votre chien en France. 
                    C&apos;est obligatoire pour tous les chiens !
                  </p>
                  <p className="text-xs text-blue-800">
                    <strong>Où le trouver ?</strong>
                  </p>
                  <ul className="text-xs text-blue-800 list-disc list-inside ml-2 space-y-1">
                    <li><strong>Sur la carte d&apos;identification</strong> donnée par votre vétérinaire</li>
                    <li><strong>Dans le passeport européen</strong> de votre chien</li>
                    <li><strong>Sur les certificats vétérinaires</strong></li>
                    <li><strong>En ligne</strong> sur <a href="https://www.i-cad.fr" target="_blank" rel="noopener noreferrer" className="underline font-semibold">www.i-cad.fr</a></li>
                  </ul>
                  <p className="text-xs text-blue-700 mt-2 italic">
                    💡 Format: 15 chiffres (puce électronique) ou tatouage
                  </p>
                </div>
              </div>

              {/* Nom */}
              <Input
                label="Nom du chien"
                name="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                error={formErrors.nom}
                placeholder="Ex: Rex, Bella..."
                required
                disabled={disabled}
              />

              {/* Sexe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexe <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sexe"
                      value="male"
                      checked={formData.sexe === 'male'}
                      onChange={(e) => setFormData({ ...formData, sexe: e.target.value as 'male' | 'female' })}
                      disabled={disabled}
                      className="w-4 h-4 text-[#FF6B35] focus:ring-[#FF6B35]"
                    />
                    <span className="text-gray-900 font-medium">♂️ Mâle</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sexe"
                      value="female"
                      checked={formData.sexe === 'female'}
                      onChange={(e) => setFormData({ ...formData, sexe: e.target.value as 'male' | 'female' })}
                      disabled={disabled}
                      className="w-4 h-4 text-[#FF6B35] focus:ring-[#FF6B35]"
                    />
                    <span className="text-gray-900 font-medium">♀️ Femelle</span>
                  </label>
                </div>
                {formErrors.sexe && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.sexe}</p>
                )}
              </div>

              {/* Race */}
              <BreedSelect
                label="Race"
                value={formData.race}
                onChange={(race) => setFormData({ ...formData, race })}
                error={formErrors.race}
                helperText="Recherchez une race officielle ou décrivez un croisé."
                required
                disabled={disabled}
              />

              {/* Date de naissance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-[#D2691E] pointer-events-none">
                    📅
                  </span>
                  <input
                    type="date"
                    name="dateNaissance"
                    value={formData.dateNaissance}
                    onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                    disabled={disabled}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-2xl border border-[#E7D9C7] bg-white px-4 py-3 pl-11 text-sm font-medium text-[#3E2A1B] shadow-inner transition focus:border-[#D2691E] focus:outline-none focus:ring-2 focus:ring-[#FFD9A6] appearance-none"
                    lang="fr-FR"
                    aria-describedby="birthdate-hint"
                  />
                </div>
                {formErrors.dateNaissance && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.dateNaissance}</p>
                )}
                {formData.dateNaissance && (
                  <p id="birthdate-hint" className="text-xs text-gray-600 mt-1">
                    📅 {formatShortDate(formData.dateNaissance)} ({formatLongFrenchDate(formData.dateNaissance)})
                    {(() => {
                      const age = formatAgeLabel(formData.dateNaissance);
                      return age ? ` · ${age}` : '';
                    })()}
                  </p>
                )}
                {!formData.dateNaissance && (
                  <p id="birthdate-hint" className="text-xs text-gray-500 mt-1">
                    Format préféré : JJ/MM/AAAA – choisissez une date dans le calendrier.
                  </p>
                )}
              </div>

              {/* Photos (mini galerie) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos du chien (jusqu&apos;à 5 photos)
                </label>
                
                {/* Affichage des photos */}
                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {formData.photos.map((photo: File, index: number) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newPhotos = formData.photos.filter((_: File, i: number) => i !== index);
                            setFormData({ ...formData, photos: newPhotos });
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bouton d'ajout */}
                {formData.photos.length < 5 && (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#FF6B35] hover:bg-orange-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="text-sm text-gray-600 font-medium">
                        Ajouter une photo
                      </p>
                      <p className="text-xs text-gray-500">
                        {formData.photos.length}/5 photos
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={disabled}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && formData.photos.length < 5) {
                          setFormData({ 
                            ...formData, 
                            photos: [...formData.photos, file] 
                          });
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
                <p className="text-sm text-gray-500 mt-2">JPG, PNG - Max 5MB par photo</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAdd}
                  disabled={disabled}
                  className="w-full sm:flex-1"
                >
                  {editIndex !== null ? 'Enregistrer' : 'Ajouter'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={disabled}
                  className="w-full sm:flex-1"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Limite atteinte */}
      {!canAddMore && !showForm && (
        <p className="text-sm text-amber-600">
          ⚠️ Vous avez atteint la limite de {maxItems} chiens
        </p>
      )}
    </div>
  );
});
