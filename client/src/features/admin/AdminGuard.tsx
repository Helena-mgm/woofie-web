"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/presentation/hooks/useAuth";
import { AuthGateLoader } from "@/features/security/components/AuthGateLoader";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/login?redirect=/admin");
      return;
    }
    if (!user?.is_admin) {
      router.replace("/dashboard");
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !user?.is_admin) {
    return <AuthGateLoader />;
  }

  return <>{children}</>;
}

export default AdminGuard;
