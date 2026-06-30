'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ProtectRoute } from '@/features/security/ProtectRoute';
import { useDogs, type DogProfile } from '@/presentation/hooks/useDogs';
import { getImageUrl } from '@/infrastructure/config/constants';

const TAILLES = ['Très petit (<5kg)', 'Petit (5-10kg)', 'Moyen (10-25kg)', 'Grand (25-40kg)', 'Très grand (>40kg)'];

// ── Forms ─────────────────────────────────────────────────────────────────────

interface DogFormData {
  name: string; icadNumber: string; icadType: string;
  race: string; taille: string; sexe: string;
  description: string; dateNaissance: string; photo: string;
}

/** Payload typé pour la création d'un chien */
type CreateDogPayload = Omit<DogProfile, 'id' | 'isLost' | 'createdAt' | 'age' | 'ownerName' | 'ownerId' | 'lostSince' | 'lostLocation' | 'lostLat' | 'lostLng' | 'lostContact' | 'lostDescription'>;

/** Payload typé pour la mise à jour d'un chien */
type UpdateDogPayload = Partial<Omit<DogProfile, 'id' | 'isLost' | 'createdAt'>>;

const emptyForm: DogFormData = {
  name: '', icadNumber: '', icadType: 'microchip',
  race: '', taille: '', sexe: '',
  description: '', dateNaissance: '', photo: '',
};

function dogToForm(d: DogProfile): DogFormData {
  return {
    name: d.name, icadNumber: d.icadNumber, icadType: d.icadType,
    race: d.race ?? '', taille: d.taille ?? '', sexe: d.sexe ?? '',
    description: d.description ?? '', dateNaissance: d.dateNaissance ?? '', photo: '',
  };
}

// ── Dog Card ──────────────────────────────────────────────────────────────────

interface DogCardProps {
  dog: DogProfile;
  onEdit: () => void;
  onDelete: () => void;
  onMarkLost: () => void;
  onMarkFound: () => void;
}

function DogCard({ dog, onEdit, onDelete, onMarkLost, onMarkFound }: DogCardProps) {
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative bg-white rounded-2xl shadow-md overflow-hidden border-2 ${dog.isLost ? 'border-red-300' : 'border-transparent'}`}
    >
      {/* Lost badge */}
      {dog.isLost && (
        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
          🚨 SIGNALÉ PERDU
        </div>
      )}

      {/* Photo */}
      <div className="h-44 bg-gradient-to-br from-[#FFF2E0] to-[#FFD9A6] flex items-center justify-center overflow-hidden relative">
        {dog.photo ? (
          <Image src={getImageUrl(dog.photo)} alt={dog.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 320px" />
        ) : (
          <span className="text-6xl opacity-40">🐕</span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-lg font-bold text-gray-900">{dog.name}</h3>
          {dog.sexe && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
              {dog.sexe === 'M' ? '♂' : '♀'}
            </span>
          )}
        </div>
        {dog.race && <p className="text-sm text-gray-500">{dog.race}{dog.taille ? ` · ${dog.taille}` : ''}</p>}
        {dog.age != null && <p className="text-xs text-gray-400 mt-0.5">{dog.age} an{dog.age > 1 ? 's' : ''}</p>}
        <p className="text-xs text-gray-300 mt-1">ICAD : {dog.icadNumber}</p>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex flex-wrap gap-2">
        <button onClick={onEdit}
          className="flex-1 px-3 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          ✏️ Modifier
        </button>
        {dog.isLost ? (
          <button onClick={onMarkFound}
            className="flex-1 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold hover:bg-green-200 transition-colors">
            ✅ Retrouvé !
          </button>
        ) : (
          <button onClick={onMarkLost}
            className="flex-1 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors">
            🚨 Perdu
          </button>
        )}
        {confirmDel ? (
          <div className="w-full flex gap-2 mt-1">
            <button onClick={() => setConfirmDel(false)}
              className="flex-1 px-3 py-1.5 rounded-full border text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
            <button onClick={onDelete}
              className="flex-1 px-3 py-1.5 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600">Confirmer</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDel(true)}
            className="px-3 py-1.5 rounded-full border border-red-200 text-red-400 text-sm hover:bg-red-50 transition-colors">
            🗑️
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Dog Form Modal ────────────────────────────────────────────────────────────

interface DogFormModalProps {
  initial?: DogFormData;
  onSave: (d: DogFormData) => Promise<void>;
  onClose: () => void;
  title: string;
}

function DogFormModal({ initial = emptyForm, onSave, onClose, title }: DogFormModalProps) {
  const [form, setForm] = useState<DogFormData>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof DogFormData>(k: K, v: DogFormData[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set('photo', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.icadNumber.trim()) {
      setError('Le nom et le numéro ICAD sont obligatoires.');
      return;
    }
    setBusy(true);
    await onSave(form);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
        <div className="bg-gradient-to-r from-[#D2691E] to-[#8B4513] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nom *</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
              placeholder="Rex, Milou, Luna…" />
          </div>

          {/* ICAD */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">N° ICAD *</label>
              <input required value={form.icadNumber} onChange={e => set('icadNumber', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
                placeholder="15 chiffres ou tatouage" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
              <select value={form.icadType} onChange={e => set('icadType', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50">
                <option value="microchip">Puce</option>
                <option value="tattoo">Tatouage</option>
              </select>
            </div>
          </div>

          {/* Race + taille */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Race</label>
              <input value={form.race} onChange={e => set('race', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50"
                placeholder="Labrador, Berger…" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Taille</label>
              <select value={form.taille} onChange={e => set('taille', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50">
                <option value="">Non précisée</option>
                {TAILLES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Sexe + Naissance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Sexe</label>
              <select value={form.sexe} onChange={e => set('sexe', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50">
                <option value="">Non précisé</option>
                <option value="M">Mâle</option>
                <option value="F">Femelle</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date de naissance</label>
              <input type="date" value={form.dateNaissance} onChange={e => set('dateNaissance', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D2691E]/50 resize-none"
              placeholder="Tempérament, particularités, signes distinctifs…" />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Photo</label>
            <input type="file" accept="image/*" onChange={handlePhoto}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#FFF2E0] file:text-[#8B4513] file:font-semibold hover:file:bg-[#FFE0B2]" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>}

          <div className="flex gap-3 pt-1 pb-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 px-4 py-2.5 rounded-full bg-[#D2691E] text-white text-sm font-semibold hover:bg-[#8B4513] transition-colors disabled:opacity-50">
              {busy ? 'Sauvegarde…' : '💾 Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Lost report modal ─────────────────────────────────────────────────────────

interface LostModalProps {
  dog: DogProfile;
  onSave: (data: { location: string; contact: string; description: string }) => Promise<void>;
  onClose: () => void;
}

function LostModal({ dog, onSave, onClose }: LostModalProps) {
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await onSave({ location, contact, description });
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">🚨 Signaler {dog.name} comme perdu</h2>
        <p className="text-sm text-gray-500 mb-5">Ces informations seront visibles publiquement pour aider à le retrouver.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Dernière localisation connue *</label>
            <input required value={location} onChange={e => setLocation(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50"
              placeholder="Ex : Parc de la Villette, Paris 19e" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Contact (téléphone ou email) *</label>
            <input required value={contact} onChange={e => setContact(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50"
              placeholder="06 12 34 56 78 ou votre@email.fr" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description / signes distinctifs</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/50 resize-none"
              placeholder="Collier rouge, boite légèrement des pattes, répond au nom…" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 px-4 py-2.5 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
              {busy ? '…' : '🚨 Lancer l\'alerte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DogsDashboardPage() {
  const { dogs, loading, createDog, updateDog, deleteDog, markLost, markFound } = useDogs();
  const [showCreate, setShowCreate] = useState(false);
  const [editDog, setEditDog]       = useState<DogProfile | null>(null);
  const [lostDog, setLostDog]       = useState<DogProfile | null>(null);

  return (
    <ProtectRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6] py-12">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">

          {/* Header */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#3E2A1B]">🐕 Mes chiens</h1>
              <p className="text-sm text-[#6B4A2B] mt-1">Gérez les profils de vos compagnons</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 bg-[#D2691E] text-white rounded-full font-semibold hover:bg-[#8B4513] transition-colors shadow-md flex-shrink-0"
            >
              + Ajouter un chien
            </button>
          </div>

          {/* Alert strip */}
          {dogs.some(d => d.isLost) && (
            <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700">
              <span className="text-xl">🚨</span>
              <p className="text-sm font-medium">
                Vous avez {dogs.filter(d => d.isLost).length} chien(s) signalé(s) comme perdu(s).&nbsp;
                <a href="/lost-dogs" className="underline hover:no-underline">Voir l'alerte publique →</a>
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-16 text-[#8B4513] animate-pulse text-lg">Chargement…</div>
          )}

          {/* Empty */}
          {!loading && dogs.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
              <div className="text-6xl mb-4">🐾</div>
              <p className="text-xl font-semibold text-gray-700">Aucun chien enregistré</p>
              <p className="text-gray-400 mt-2 mb-6">Ajoutez le profil de votre compagnon !</p>
              <button onClick={() => setShowCreate(true)}
                className="px-6 py-3 bg-[#D2691E] text-white rounded-full font-semibold hover:bg-[#8B4513] transition-colors">
                + Ajouter un chien
              </button>
            </div>
          )}

          {/* Grid */}
          <AnimatePresence>
            {!loading && dogs.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {dogs.map(dog => (
                  <DogCard
                    key={dog.id}
                    dog={dog}
                    onEdit={() => setEditDog(dog)}
                    onDelete={async () => { await deleteDog(dog.id); }}
                    onMarkLost={() => setLostDog(dog)}
                    onMarkFound={async () => { await markFound(dog.id); }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Create modal */}
        {showCreate && (
          <DogFormModal
            title="Ajouter un chien 🐾"
            onClose={() => setShowCreate(false)}
            onSave={async (d) => {
              const payload: CreateDogPayload = {
                name: d.name,
                icadNumber: d.icadNumber,
                icadType: d.icadType,
                race: d.race || null,
                taille: d.taille || null,
                sexe: d.sexe || null,
                description: d.description || null,
                dateNaissance: d.dateNaissance || null,
                photo: d.photo || null,
              };
              const ok = await createDog(payload);
              if (ok) setShowCreate(false);
            }}
          />
        )}

        {/* Edit modal */}
        {editDog && (
          <DogFormModal
            title={`Modifier ${editDog.name}`}
            initial={dogToForm(editDog)}
            onClose={() => setEditDog(null)}
            onSave={async (d) => {
              const payload: UpdateDogPayload = {
                name: d.name,
                race: d.race || null,
                taille: d.taille || null,
                sexe: d.sexe || null,
                description: d.description || null,
                dateNaissance: d.dateNaissance || null,
                photo: d.photo || undefined,
              };
              const ok = await updateDog(editDog.id, payload);
              if (ok) setEditDog(null);
            }}
          />
        )}

        {/* Lost modal */}
        {lostDog && (
          <LostModal
            dog={lostDog}
            onClose={() => setLostDog(null)}
            onSave={async (data) => {
              await markLost(lostDog.id, data);
              setLostDog(null);
            }}
          />
        )}
      </div>
    </ProtectRoute>
  );
}
