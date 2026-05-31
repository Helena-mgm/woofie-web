import { ProtectRoute } from "@/features/security/ProtectRoute";
import ClientMapWrapper from "./ClientMapWrapper";

export default function CommunityMapPage() {
  return (
    <ProtectRoute>
      <div className="min-h-screen overflow-x-hidden bg-[#FFF7ED] pb-10 pt-8 sm:pt-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:gap-8 lg:px-8">
          <header className="space-y-1 sm:space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#A0522D]/80">
              Explorer
            </p>
            <h1 className="text-3xl font-bold text-[#3E2A1B] sm:text-4xl">Carte de la communauté</h1>
            <p className="max-w-2xl text-sm text-[#6B4A2B]/90 sm:text-base">
              Repérez les parcs, vétérinaires et services recommandés autour de vous, et laissez-vous guider directement depuis Woofie.
            </p>
          </header>
          <ClientMapWrapper />
        </div>
      </div>
    </ProtectRoute>
  );
}
