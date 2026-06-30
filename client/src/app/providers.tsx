"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "@/presentation/components/Header";
import { Footer } from "@/presentation/components/Footer";
import { usePathname } from "next/navigation";

// Routes où le Footer ne doit pas apparaître et où le layout est plein écran
const FULLSCREEN_ROUTES = ["/map", "/messages"];

function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r));

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
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000,       // données fraîches 2 min
            gcTime: 5 * 60 * 1000,           // cache gardé 5 min
            refetchOnWindowFocus: false,      // pas de re-fetch au focus
            retry: 1,                         // 1 seule tentative en cas d'erreur
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>{children}</AppShell>
    </QueryClientProvider>
  );
}
