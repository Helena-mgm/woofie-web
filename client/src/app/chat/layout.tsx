import type { ReactNode } from "react";

export default function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <main className="h-[calc(100vh-64px)]">{children}</main>;
}
