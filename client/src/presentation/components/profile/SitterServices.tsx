'use client';

import { motion } from 'framer-motion';

interface SitterServicesProps {
  bio?: string | null;
  services?: string[];
  pricePerHour?: number | null;
  isAvailable?: boolean;
  experienceYears?: number | null;
  telephone?: string;
  email: string;
}

export function SitterServices({
  bio,
  services,
  pricePerHour,
  isAvailable,
  experienceYears,
  telephone,
  email,
}: SitterServicesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-10 grid gap-6 rounded-3xl border border-[#F1E5D4] bg-gradient-to-br from-white via-[#FFF9F3] to-[#FFEEDB] p-6 shadow-lg"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-[#8B4513]">Services proposés</h2>
        <p className="text-sm text-[#6B4A2B]">
          {bio || 'Ce dog-sitter se présente prochainement.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#A0522D] mb-2">Tarifs & disponibilité</h3>
          <ul className="space-y-2 text-sm text-[#3E2A1B]">
            <li>
              <span className="font-semibold">Tarif horaire :</span>{' '}
              {pricePerHour !== null && pricePerHour !== undefined
                ? `${pricePerHour.toFixed(2)} €`
                : 'À définir'}
            </li>
            <li>
              <span className="font-semibold">Disponibilité :</span>{' '}
              {isAvailable ? '✅ Disponible' : '⏳ Indisponible'}
            </li>
            {experienceYears !== null && experienceYears !== undefined && (
              <li>
                <span className="font-semibold">Expérience :</span>{' '}
                {experienceYears} an{experienceYears > 1 ? 's' : ''}
              </li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#A0522D] mb-2">Contact</h3>
          <ul className="space-y-2 text-sm text-[#3E2A1B]">
            <li>
              <span className="font-semibold">Email :</span>{' '}
              <a href={`mailto:${email}`} className="text-[#D2691E] hover:underline">
                {email}
              </a>
            </li>
            {telephone && (
              <li>
                <span className="font-semibold">Téléphone :</span>{' '}
                <a href={`tel:${telephone}`} className="text-[#D2691E] hover:underline">
                  {telephone}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      {services && services.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#A0522D] mb-3">Compétences</h3>
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <span
                key={service}
                className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-[#8B4513] shadow-sm"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default SitterServices;
