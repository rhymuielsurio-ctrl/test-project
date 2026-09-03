import { getMockSession } from "@/lib/auth";
import { NavLinks } from "./nav-links";
import { MobileNav } from "./mobile-nav";
import { LogoutButton } from "./logout-button";
import { NotificationsPopover } from "@/components/features/notifications-popover";
import { BriefcaseBusiness } from "lucide-react";

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getMockSession();
  const role = session?.role ?? "employee";
  const name = session?.name ?? "Guest";

  return (
    <div className="flex min-h-dvh">
      <aside className="fixed inset-y-0 z-30 hidden w-64 flex-col border-r border-border bg-background md:flex">
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BriefcaseBusiness className="size-4" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-primary">LeaveTrack</span>
          </div>
          {session && <NotificationsPopover />}
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <NavLinks role={role} className="flex flex-col gap-1" />
        </nav>

        <div className="flex items-center justify-between gap-2 border-t border-border p-4">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
              aria-label={`Profile for ${name}`}
              title={name}
            >
              {initialOf(name)}
            </div>
            <span className="truncate text-sm font-medium">{name}</span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BriefcaseBusiness className="size-4" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-primary">LeaveTrack</span>
          </div>
          <div className="flex items-center gap-1">
            {session && <NotificationsPopover />}
            <MobileNav role={role} name={name} />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
