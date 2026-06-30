'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/presentation/hooks/useAuth';
import { apiGet, apiRequest, tokenManager } from '@/shared/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────
interface DashStats {
  dogsCount: number;
  postsCount: number;
  conversationsCount: number;
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, icon }: { value: number | string; label: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-1">
      <div className="text-2xl">{icon}</div>
      <div className="text-3xl font-bold text-[#D2691E]">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

// ── Action card ──────────────────────────────────────────────────────────────
function ActionCard({
  emoji, title, description, href, onClick,
}: { emoji: string; title: string; description: string; href?: string; onClick?: () => void }) {
  const inner = (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow h-full flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D2691E] to-[#8B4513] flex items-center justify-center text-white text-2xl shrink-0">
          {emoji}
        </div>
        <h2 className="text-xl font-bold text-[#8B4513]">{title}</h2>
      </div>
      <p className="text-gray-500 text-sm flex-1 mb-4">{description}</p>
      <div className="w-full px-4 py-2 bg-[#D2691E] text-white rounded-lg font-semibold text-sm text-center hover:bg-[#8B4513] transition-colors">
        Accéder
      </div>
    </div>
  );

  if (href) return <Link href={href} className="block">{inner}</Link>;
  return <button className="text-left block w-full" onClick={onClick}>{inner}</button>;
}

// ── RGPD export ──────────────────────────────────────────────────────────────
function RgpdPanel() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      const res = await apiRequest('/api/me/export');
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `woofie-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setDone(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 border-l-4 border-blue-400">
      <h3 className="font-bold text-[#3E2A1B] mb-1">🔒 Vos données (RGPD)</h3>
      <p className="text-sm text-gray-500 mb-4">
        Conformément au RGPD, vous pouvez télécharger toutes vos données personnelles ou supprimer votre compte.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleExport}
          disabled={busy}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {busy ? 'Export…' : done ? '✓ Téléchargé' : 'Exporter mes données'}
        </button>
        <Link href="/dashboard/settings" className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
          Supprimer mon compte
        </Link>
        <Link href="/privacy" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          Politique de confidentialité
        </Link>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<DashStats>({ dogsCount: 0, postsCount: 0, conversationsCount: 0 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) router.push('/login');
  }, [mounted, loading, isAuthenticated, router]);

  const loadStats = useCallback(async () => {
    if (!user) return;
    // Load dog count for owners
    if (user.type === 'owner') {
      const { ok, data } = await apiGet('/api/profile/dogs');
      if (ok && Array.isArray(data)) setStats(s => ({ ...s, dogsCount: data.length }));
    }
    // Conversations count
    const { ok: cok, data: cdata } = await apiGet('/api/conversations');
    if (cok && Array.isArray(cdata)) setStats(s => ({ ...s, conversationsCount: cdata.length }));
  }, [user]);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#D2691E] mx-auto mb-4" />
          <p className="text-[#8B4513] font-semibold">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ── Owner Dashboard ─────────────────────────────────────────────────────────
  if (user.type === 'owner') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6]">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Hero */}
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl font-bold text-[#8B4513] mb-1">Bonjour, {user.nom} ! 🐕</h1>
              <p className="text-gray-600">Gérez vos chiens et trouvez le dog-sitter parfait.</p>
            </div>
            <div className="flex items-center gap-2">
              {user.is_verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                  ✓ Compte vérifié
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                  ⏳ Non vérifié
                </span>
              )}
              {user.is_admin && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-600 border border-red-300">
                  🔴 Admin
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard value={stats.dogsCount} label="Chiens enregistrés" icon="🐶" />
            <StatCard value={stats.conversationsCount} label="Conversations" icon="💬" />
            <StatCard value="0" label="Réservations actives" icon="📅" />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <ActionCard emoji="🐶" title="Mes Chiens" description="Gérez les profils de vos compagnons." href="/dashboard/dogs" />
            <ActionCard emoji="🔍" title="Chercher un sitter" description="Trouvez un dog-sitter disponible dans votre ville." href="/services" />
            <ActionCard emoji="💬" title="Messages" description="Discutez avec votre dog-sitter ou WoofieBot." href="/messages" />
            <ActionCard emoji="📰" title="Communauté" description="Partagez des photos et astuces avec la communauté." href="/community" />
            <ActionCard emoji="🗺️" title="Carte" description="Trouvez des parcs et espaces canins autour de vous." href="/map" />
            <ActionCard emoji="⚙️" title="Paramètres" description="Gérez votre compte et vos préférences." href="/dashboard/settings" />
          </div>

          {/* RGPD */}
          <RgpdPanel />
        </div>
      </div>
    );
  }

  // ── Sitter Dashboard ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6]">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-bold text-[#8B4513] mb-1">
              Bonjour, {user.prenom} {user.nom} ! 🐾
            </h1>
            <p className="text-gray-600">Gérez vos services et vos demandes de garde.</p>
          </div>
          <div className="flex items-center gap-2">
            {user.is_admin && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-600 border border-red-300">
                🔴 Admin
              </span>
            )}
          </div>
        </div>

        {/* Verification banner */}
        {!user.is_verified ? (
          <div className="mb-6 rounded-xl bg-yellow-50 border-l-4 border-yellow-400 p-4 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-yellow-800">Compte en attente de vérification</p>
              <p className="text-sm text-yellow-700 mt-0.5">
                Votre SIRET est en cours de vérification par notre équipe. Vous ne pouvez pas encore accepter de gardes. Vous serez notifié par email une fois validé.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-xl bg-green-50 border-l-4 border-green-400 p-4 flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">Compte vérifié !</p>
              <p className="text-sm text-green-700 mt-0.5">Vous pouvez accepter des demandes de garde.</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard value={stats.conversationsCount} label="Conversations" icon="💬" />
          <StatCard value="0" label="Demandes en attente" icon="📬" />
          <StatCard value="0" label="Gardes terminées" icon="🏁" />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <ActionCard emoji="👤" title="Mon Profil" description="Gérez votre profil visible par les propriétaires." href="/dashboard/sitter/profile" />
          <ActionCard emoji="💬" title="Messages" description="Répondez aux demandes et discutez avec les propriétaires." href="/messages" />
          <ActionCard emoji="📰" title="Communauté" description="Échangez avec d'autres passionnés de chiens." href="/community" />
          <ActionCard emoji="🗺️" title="Carte" description="Consultez les espaces canins proches de vous." href="/map" />
          {user.is_admin && (
            <ActionCard emoji="🛡️" title="Administration" description="Gérez les utilisateurs, mots clés et modération." href="/admin" />
          )}
          <ActionCard emoji="⚙️" title="Paramètres" description="Gérez votre compte et vos préférences." href="/dashboard/settings" />
        </div>

        {/* RGPD */}
        <RgpdPanel />
      </div>
    </div>
  );
}
