import { getMockSession } from "@/lib/auth";
import { NavLinks } from "./nav-links";
import { MobileNav } from "./mobile-nav";
import { LogoutButton } from "./logout-button";

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export async function Navbar() {
  const session = await getMockSession();
  const role = session?.role ?? "employee";
  const name = session?.name ?? "Guest";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-primary">LeaveTrack</span>
        </div>

        <NavLinks role={role} className="hidden items-center gap-1 md:flex" />

        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
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
