import { ProtectRoute } from "@/features/security/ProtectRoute";
import { CommunityFeedView } from "@/features/community/feed/CommunityFeedView";

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5E6] via-[#FFE8CC] to-[#FFD9A6] pb-16">
      <ProtectRoute>
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-8">
          <CommunityFeedView />
        </div>
      </ProtectRoute>
    </div>
  );
}
