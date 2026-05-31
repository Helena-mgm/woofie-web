"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { tokenManager } from "@/shared/lib/api-v2";
import { AuthGateLoader } from "./components/AuthGateLoader";

export function ProtectRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = tokenManager.get();
    if (!token) {
      const redirect = encodeURIComponent(window.location.pathname);
      router.replace(`/login?redirect=${redirect}`);
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return <AuthGateLoader />;
  }

  return <>{children}</>;
}
