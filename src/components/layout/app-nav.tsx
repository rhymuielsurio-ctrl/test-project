"use client";

import { usePathname } from "next/navigation";

interface AppNavProps {
  shell: React.ReactNode;
  children: React.ReactNode;
}

export function AppNav({ shell, children }: AppNavProps) {
  const pathname = usePathname();
  if (pathname === "/login") return <>{children}</>;
  return <>{shell}</>;
}
