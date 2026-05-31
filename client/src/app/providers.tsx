"use client";

import { ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "@/presentation/components/Header";
import { Footer } from "@/presentation/components/Footer";
import { LoadingScreen } from "@/presentation/components/home/LoadingScreen";
import { usePathname } from "next/navigation";

// Routes où le Footer ne doit pas apparaître et où le layout est plein écran
const FULLSCREEN_ROUTES = ["/community/map", "/messages"];

function AppShell({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r));

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <LoadingScreen />;
  }

  return (
    <div className={isFullscreen ? "flex h-full flex-col overflow-hidden" : "flex min-h-full flex-col"}>
      <Header />
      <main className={isFullscreen ? "flex flex-1 flex-col min-h-0 overflow-hidden" : "flex flex-1 flex-col"}>
        {children}
      </main>
      {!isFullscreen && <Footer />}
    </div>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>{children}</AppShell>
    </QueryClientProvider>
  );
}
