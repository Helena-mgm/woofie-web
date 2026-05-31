import { ProtectRoute } from "@/features/security/ProtectRoute";
import { MessagesView } from "@/features/messages/MessagesView";

export default function MessagesPage() {
  return (
    <ProtectRoute>
      <MessagesView />
    </ProtectRoute>
  );
}
