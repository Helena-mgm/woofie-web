'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/presentation/hooks/useAuth';

export default function DashboardPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#D2691E] mx-auto mb-4"></div>
          <p className="text-[#8B4513] font-semibold">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Owner Dashboard
  if (user.type === 'owner') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6]">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#8B4513] mb-2">
              Bienvenue, {user.nom} ! 🐕
            </h1>
            <p className="text-gray-700 text-lg">
              Gérez vos chiens et trouvez le dog-sitter parfait
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mes Chiens Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D2691E] to-[#8B4513] flex items-center justify-center text-white text-2xl">
                  🐶
                </div>
                <h2 className="text-2xl font-bold text-[#8B4513]">Mes Chiens</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Gérez les profils de vos compagnons
              </p>
              <button className="w-full px-4 py-2 bg-[#D2691E] text-white rounded-lg hover:bg-[#8B4513] font-semibold transition-colors">
                Voir mes chiens
              </button>
            </div>

            {/* Rechercher un Dog-Sitter */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D2691E] to-[#8B4513] flex items-center justify-center text-white text-2xl">
                  🔍
                </div>
                <h2 className="text-2xl font-bold text-[#8B4513]">Rechercher</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Trouvez un dog-sitter dans votre ville
              </p>
              <button className="w-full px-4 py-2 bg-[#D2691E] text-white rounded-lg hover:bg-[#8B4513] font-semibold transition-colors">
                Rechercher
              </button>
            </div>

            {/* Mes Réservations */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D2691E] to-[#8B4513] flex items-center justify-center text-white text-2xl">
                  📅
                </div>
                <h2 className="text-2xl font-bold text-[#8B4513]">Réservations</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Consultez vos gardes à venir
              </p>
              <button className="w-full px-4 py-2 bg-[#D2691E] text-white rounded-lg hover:bg-[#8B4513] font-semibold transition-colors">
                Voir les réservations
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-3xl font-bold text-[#D2691E]">0</div>
              <div className="text-gray-600">Chiens enregistrés</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-3xl font-bold text-[#D2691E]">0</div>
              <div className="text-gray-600">Réservations actives</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-3xl font-bold text-[#D2691E]">0</div>
              <div className="text-gray-600">Gardes terminées</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sitter Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#8B4513] mb-2">
            Bienvenue, {user.prenom} {user.nom} ! 🐾
          </h1>
          <p className="text-gray-700 text-lg">
            Gérez vos services et vos demandes de garde
          </p>
          
          {/* Verification Status */}
          {!user.is_verified && (
            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-yellow-800">Compte en attente de vérification</p>
                  <p className="text-sm text-yellow-700">
                    Votre SIRET est en cours de vérification par notre équipe. Vous serez notifié par email une fois validé.
                  </p>
                </div>
              </div>
            </div>
          )}

          {user.is_verified && (
            <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-green-800">✨ Compte vérifié</p>
                  <p className="text-sm text-green-700">Vous pouvez maintenant accepter des demandes de garde !</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mon Profil Sitter */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D2691E] to-[#8B4513] flex items-center justify-center text-white text-2xl">
                👤
              </div>
              <h2 className="text-2xl font-bold text-[#8B4513]">Mon Profil</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Gérez votre profil et vos services
            </p>
            <Link
              href="/dashboard/sitter/profile"
              className="block w-full rounded-lg bg-[#D2691E] px-4 py-2 text-center font-semibold text-white transition-colors hover:bg-[#8B4513]"
            >
              Modifier mon profil
            </Link>
          </div>

          {/* Demandes en attente */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D2691E] to-[#8B4513] flex items-center justify-center text-white text-2xl">
                📬
              </div>
              <h2 className="text-2xl font-bold text-[#8B4513]">Demandes</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Nouvelles demandes de garde
            </p>
            <button className="w-full px-4 py-2 bg-[#D2691E] text-white rounded-lg hover:bg-[#8B4513] font-semibold transition-colors">
              Voir les demandes
            </button>
          </div>

          {/* Mes Gardes */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D2691E] to-[#8B4513] flex items-center justify-center text-white text-2xl">
                🗓️
              </div>
              <h2 className="text-2xl font-bold text-[#8B4513]">Mes Gardes</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Gardes confirmées et historique
            </p>
            <button className="w-full px-4 py-2 bg-[#D2691E] text-white rounded-lg hover:bg-[#8B4513] font-semibold transition-colors">
              Voir mes gardes
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="text-3xl font-bold text-[#D2691E]">0</div>
            <div className="text-gray-600">Demandes en attente</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="text-3xl font-bold text-[#D2691E]">0</div>
            <div className="text-gray-600">Gardes actives</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="text-3xl font-bold text-[#D2691E]">0</div>
            <div className="text-gray-600">Gardes terminées</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <div className="text-3xl font-bold text-[#D2691E]">-</div>
            <div className="text-gray-600">Note moyenne</div>
          </div>
        </div>
      </div>
    </div>
  );
}
