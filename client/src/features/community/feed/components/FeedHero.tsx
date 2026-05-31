"use client";

import { Badge } from "@/shared/ui/badge";

export function FeedHero() {
  return (
    <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6] p-8 sm:p-12">
      <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-white/40 blur-3xl" />
      <div className="absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-white/30 blur-2xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <header className="space-y-4">
          <Badge>Communauté</Badge>
          <h1 className="text-4xl font-bold text-[#3E2A1B] sm:text-5xl">
            Partagez la vie avec votre meilleur ami
          </h1>
          <p className="max-w-xl text-base text-[#6B4A2B]">
            Célébrez vos aventures du quotidien, demandez conseil à la meute et rencontrez des
            propriétaires proches de chez vous. Woofie est l’endroit le plus bienveillant pour les amoureux des chiens.
          </p>
        </header>
        <dl className="grid grid-cols-2 gap-4 rounded-3xl border border-white/70 bg-white/70 p-6 text-center text-sm text-[#6B4A2B] shadow-[0_12px_40px_-24px_rgba(139,69,19,0.3)] backdrop-blur">
          <div>
            <dt className="font-semibold text-[#8B4513]">Posts quotidiens</dt>
            <dd className="mt-1 text-2xl font-bold text-[#3E2A1B]">1.2k</dd>
          </div>
          <div>
            <dt className="font-semibold text-[#8B4513]">Rencontres locales</dt>
            <dd className="mt-1 text-2xl font-bold text-[#3E2A1B]">320</dd>
          </div>
          <div>
            <dt className="font-semibold text-[#8B4513]">Événements Woofie</dt>
            <dd className="mt-1 text-2xl font-bold text-[#3E2A1B]">58</dd>
          </div>
          <div>
            <dt className="font-semibold text-[#8B4513]">Chiens heureux</dt>
            <dd className="mt-1 text-2xl font-bold text-[#3E2A1B]">∞</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
