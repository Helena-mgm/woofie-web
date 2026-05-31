import { ProtectRoute } from "@/features/security/ProtectRoute";
import { ServicesView } from "@/features/services/ServicesView";

export default function ServicesPage() {
  return (
    <ProtectRoute>
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6] py-12">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">
          <ServicesView />
        </div>
      </div>
    </ProtectRoute>
  );
}
