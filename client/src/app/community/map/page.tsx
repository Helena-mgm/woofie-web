import { ProtectRoute } from "@/features/security/ProtectRoute";
import ClientMapWrapper from "./ClientMapWrapper";

export default function CommunityMapPage() {
  return (
    <ProtectRoute>
      {/* Full-bleed map — no padding, no max-width */}
      {/* Header mobile ≈ 96px (6rem), desktop ≈ 112px (7rem) */}
      <div className="w-full overflow-hidden" style={{ height: "calc(100dvh - 6rem)" }} data-map-page>
        <ClientMapWrapper />
      </div>
    </ProtectRoute>
  );
}
