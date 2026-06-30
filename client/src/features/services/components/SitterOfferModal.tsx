"use client";

import { useEffect, useState } from "react";
import { availableServices } from "@/infrastructure/data/services";
import { apiGet, apiPut } from "@/shared/lib/api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/presentation/components/ui";
import { Textarea } from "@/shared/ui/textarea";
import { LIMITS } from "@/infrastructure/config/constants";

interface SitterProfileResponse {
  id: number;
  bio?: string | null;
  services?: string[];
  price_per_hour?: number | null;
  is_available?: boolean;
  experience_years?: number | null;
  city?: string;
  telephone?: string;
  email: string;
}

type FormState = {
  bio: string;
  services: string[];
  price_per_hour: string;
  is_available: boolean;
  experience_years: string;
  ville: string;
  telephone: string;
};

interface SitterOfferModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function SitterOfferModal({ onClose, onSuccess }: SitterOfferModalProps) {
  const [form, setForm] = useState<FormState>({
    bio: "",
    services: [],
    price_per_hour: "",
    is_available: true,
    experience_years: "",
    ville: "",
    telephone: "",
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      const { ok, data } = await apiGet("/api/sitters/me");
      if (cancelled) return;

      if (ok && data) {
        const sitter = data as SitterProfileResponse;
        setForm({
          bio: sitter.bio ?? "",
          services: sitter.services ?? [],
          price_per_hour:
            sitter.price_per_hour !== null && sitter.price_per_hour !== undefined
              ? sitter.price_per_hour.toString()
              : "",
          is_available: sitter.is_available ?? true,
          experience_years:
            sitter.experience_years !== null && sitter.experience_years !== undefined
              ? sitter.experience_years.toString()
              : "",
          ville: sitter.city ?? "",
          telephone: sitter.telephone ?? "",
        });
      }
      setLoading(false);
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleService = (service: string) => {
    setForm((prev) => {
      const has = prev.services.includes(service);
      return {
        ...prev,
        services: has
          ? prev.services.filter((s) => s !== service)
          : [...prev.services, service],
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);
    setSuccess(null);
    setSaving(true);

    try {
      if (!form.bio.trim())
        throw new Error("Présentez vos services en quelques phrases.");
      if (form.services.length === 0)
        throw new Error("Sélectionnez au moins un service.");
      if (form.price_per_hour === "" || Number(form.price_per_hour) <= 0)
        throw new Error("Indiquez un tarif horaire valide.");
      if (
        form.telephone &&
        !/^0[1-9]\d{8}$/.test(form.telephone.replace(/\s+/g, ""))
      )
        throw new Error("Format de téléphone invalide (ex : 0612345678).");
      if (!form.ville.trim()) throw new Error("Indiquez votre ville.");

      const payload = {
        bio: form.bio.trim(),
        services: form.services,
        price_per_hour: Number(form.price_per_hour),
        is_available: form.is_available,
        experience_years:
          form.experience_years === "" ? null : Number(form.experience_years),
        ville: form.ville.trim(),
        telephone: form.telephone.replace(/\s+/g, ""),
      };

      const { ok } = await apiPut("/api/sitters/me", payload);
      if (ok) {
        setSuccess("Votre annonce a été mise à jour ✨");
        window.dispatchEvent(new Event("auth-change"));
        onSuccess?.();
        setTimeout(() => onClose(), 1500);
      } else {
        throw new Error("Impossible de mettre à jour votre profil.");
      }
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Impossible de mettre à jour votre profil."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-white px-6 py-8 shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        {/* Header */}
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#8B4513]">
              Mon annonce dog-sitter
            </h2>
            <p className="mt-1 text-sm text-[#6B4A2B]">
              Complétez vos informations pour apparaître dans la liste des
              services.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="ml-4 rounded-full p-2 text-[#8B4513] hover:bg-[#FFF1E0] transition-colors"
          >
            ✕
          </button>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-2xl bg-[#FFF5E6]"
              />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {serverError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}
            {success && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#8B4513]">
                Présentation <span className="text-red-500">*</span>
              </label>
              <Textarea
                rows={4}
                maxLength={LIMITS.maxBioLength}
                value={form.bio}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bio: e.target.value }))
                }
                placeholder="Décrivez votre expérience, votre environnement d'accueil, vos spécialités..."
              />
              <div className="flex justify-end text-xs text-[#6B4A2B]">
                <span>
                  {form.bio.length}/{LIMITS.maxBioLength}
                </span>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#8B4513]">
                Services proposés{" "}
                <span className="text-red-500">*</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {availableServices.map((service) => {
                  const selected = form.services.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      aria-pressed={selected}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                        selected
                          ? "bg-[#D2691E] text-white shadow"
                          : "bg-[#FFF5E6] text-[#8B4513] hover:bg-[#FFE4C4]"
                      }`}
                    >
                      {service}
                    </button>
                  );
                })}
              </div>
              {form.services.length === 0 && (
                <p className="text-xs text-red-600">
                  Choisissez au moins un service
                </p>
              )}
            </div>

            {/* Champs numériques */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Tarif horaire (€) *"
                type="number"
                min={1}
                step="1"
                value={form.price_per_hour}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    price_per_hour: e.target.value,
                  }))
                }
                required
              />
              <Input
                label="Années d'expérience"
                type="number"
                min={0}
                step="1"
                value={form.experience_years}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    experience_years: e.target.value,
                  }))
                }
                placeholder="3"
              />
              <Input
                label="Ville *"
                value={form.ville}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, ville: e.target.value }))
                }
                required
              />
              <Input
                label="Téléphone *"
                value={form.telephone}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    telephone: e.target.value,
                  }))
                }
                placeholder="0612345678"
                required
              />
            </div>

            {/* Disponibilité */}
            <div className="rounded-2xl border border-[#F1E5D4] bg-[#FFF8EF] px-4 py-3">
              <label className="flex items-center gap-3 text-sm font-semibold text-[#8B4513] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_available: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-[#D2691E] text-[#D2691E] focus:ring-[#D2691E]"
                />
                Disponible pour de nouvelles demandes
              </label>
              <p className="mt-1 text-xs text-[#8B4513]/70">
                Décochez si vous ne prenez plus de nouveaux clients
                actuellement.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement…" : "Publier mon annonce"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default SitterOfferModal;
