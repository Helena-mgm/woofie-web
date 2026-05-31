"use client";

import { ReactNode, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "@/presentation/components/Header";
import { Footer } from "@/presentation/components/Footer";
import { LoadingScreen } from "@/presentation/components/home/LoadingScreen";

function AppShell({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

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
    <>
      <Header />
      {children}
      <Footer />
    </>
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
