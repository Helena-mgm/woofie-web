import { ProtectRoute } from "@/features/security/ProtectRoute";
import ClientMapWrapper from "./clientmapwrapper";

export default function MapPage() {
  return (
    <ProtectRoute>
      <div className="w-full overflow-hidden" style={{ height: "calc(100dvh - 6rem)" }} data-map-page>
        <ClientMapWrapper />
      </div>
    </ProtectRoute>
  );
}
