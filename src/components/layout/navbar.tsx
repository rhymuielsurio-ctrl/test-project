import { getMockSession } from "@/lib/auth";
import { NavLinks } from "./nav-links";
import { MobileNav } from "./mobile-nav";
import { LogoutButton } from "./logout-button";
import { BriefcaseBusiness } from "lucide-react";

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export async function Navbar() {
  const session = await getMockSession();
  const role = session?.role ?? "employee";
  const name = session?.name ?? "Guest";

  return (
    <header className="bg-background/80 sticky top-0 z-30 border-b border-border backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BriefcaseBusiness className="size-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-primary">LeaveTrack</span>
        </div>

        <NavLinks role={role} className="hidden items-center gap-1 md:flex" />

        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
            aria-label={`Profile for ${name}`}
            title={name}
          >
            {initialOf(name)}
          </div>
          <LogoutButton />
          <MobileNav role={role} />
        </div>
      </div>
    </header>
  );
}
