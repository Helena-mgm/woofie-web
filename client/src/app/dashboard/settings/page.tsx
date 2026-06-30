'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectRoute } from '@/features/security/ProtectRoute';
import { useAuth } from '@/presentation/hooks/useAuth';
import { apiRequest, tokenManager } from '@/shared/lib/api';

// ── Delete Account Modal ──────────────────────────────────────────────────────

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const { user }     = useAuth();
  const router       = useRouter();
  const [step, setStep]         = useState<1 | 2>(1);
  const [confirm, setConfirm]   = useState('');
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const MAGIC = 'SUPPRIMER';

  const handleDelete = async () => {
    if (confirm !== MAGIC) {
      setError(`Veuillez taper exactement « ${MAGIC} » pour confirmer.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await apiRequest('/api/account', { method: 'DELETE' });
      if (res.ok) {
        tokenManager.remove();
        router.push('/?deleted=1');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Une erreur est survenue. Réessayez.');
        setBusy(false);
      }
    } catch {
      setError('Erreur réseau. Réessayez.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-red-600 px-6 py-5 flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
          <div>
            <h2 className="text-white font-bold text-lg">Suppression du compte</h2>
            <p className="text-red-100 text-sm">Action irréversible</p>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <>
              <p className="text-gray-700 mb-4">
                Vous êtes sur le point de supprimer définitivement le compte de{' '}
                <span className="font-semibold">{user?.prenom} {user?.nom}</span>.
              </p>
              <ul className="text-sm text-gray-600 space-y-1.5 mb-6 bg-red-50 rounded-xl p-4">
                <li>🗑️ Toutes vos données personnelles seront effacées</li>
                <li>🐕 Les profils de vos chiens seront supprimés</li>
                <li>📅 Vos événements et réservations seront annulés</li>
                <li>💬 Vos messages seront supprimés</li>
                <li className="text-red-600 font-medium pt-1">Cette action est conforme au RGPD et irréversible.</li>
              </ul>
              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Annuler
                </button>
                <button onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2.5 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700">
                  Continuer →
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-gray-700 mb-2">
                Pour confirmer, tapez <span className="font-mono font-bold text-red-600">{MAGIC}</span> ci-dessous :
              </p>
              <input
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(null); }}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-red-400 mb-4"
                placeholder={MAGIC}
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 mb-4">{error}</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setStep(1); setConfirm(''); setError(null); }} disabled={busy}
                  className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  ← Retour
                </button>
                <button
                  onClick={handleDelete}
                  disabled={busy || confirm !== MAGIC}
                  className="flex-1 px-4 py-2.5 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 transition-colors"
                >
                  {busy ? 'Suppression…' : '🗑️ Supprimer mon compte'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <ProtectRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6] py-12">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-8">

          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="text-sm text-[#8B4513] hover:underline">← Tableau de bord</Link>
            <h1 className="text-3xl font-bold text-[#3E2A1B] mt-2">⚙️ Paramètres du compte</h1>
            {user && (
              <p className="text-sm text-[#6B4A2B] mt-1">{user.email}</p>
            )}
          </div>

          {/* Section: Profil */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-800">Informations du compte</h2>
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  Nom : <span className="font-medium text-gray-900">{user?.prenom} {user?.nom}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Email : <span className="font-medium text-gray-900">{user?.email}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Type : <span className="font-medium text-gray-900 capitalize">{user?.type === 'owner' ? 'Propriétaire' : 'Dog-sitter'}</span>
                </p>
              </div>
              <Link href={user?.type === 'sitter' ? '/dashboard/sitter/profile' : '/dashboard'}
                className="px-4 py-2 rounded-full border border-[#D2691E] text-[#D2691E] text-sm font-medium hover:bg-[#FFF2E0] transition-colors">
                Modifier le profil →
              </Link>
            </div>
          </div>

          {/* Section: Données personnelles RGPD */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-800">Données personnelles (RGPD)</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Conformément au Règlement Général sur la Protection des Données (RGPD), vous avez le droit
                d'accéder, de modifier et de supprimer vos données personnelles à tout moment.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/privacy"
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
                  📄 Politique de confidentialité
                </Link>
                <a href="mailto:privacy@woofie.fr?subject=Demande%20export%20RGPD"
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
                  📦 Exporter mes données
                </a>
              </div>
            </div>
          </div>

          {/* Section: Zone danger */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-red-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50">
              <h2 className="text-base font-semibold text-red-700">⚠️ Zone de danger</h2>
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Supprimer mon compte</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Supprime définitivement toutes vos données. Conformément au RGPD, cette action est irréversible.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex-shrink-0 px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                🗑️ Supprimer le compte
              </button>
            </div>
          </div>

        </div>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
      )}
    </ProtectRoute>
  );
}
