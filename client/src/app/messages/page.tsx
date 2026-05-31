import { ProtectRoute } from "@/features/security/ProtectRoute";
import { MessagesView } from "@/features/messages/MessagesView";

export default function MessagesPage() {
  return (
    <ProtectRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6] py-12">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
          <header className="mb-8 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#A0522D]">Boîte de réception</p>
            <h1 className="text-4xl font-bold text-[#3E2A1B]">Messages</h1>
            <p className="max-w-2xl text-sm text-[#6B4A2B]">
              Continuez la discussion avec les propriétaires, les dog-sitters et WoofieBot.
            </p>
          </header>
          <MessagesView />
        </div>
      </div>
    </ProtectRoute>
  );
}
