import type { ReactNode } from "react";
import { AdminGuard } from "@/features/admin/AdminGuard";
import { AdminShell } from "@/features/admin/components/AdminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
