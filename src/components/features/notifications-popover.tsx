"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { NotificationItem } from "@/lib/leave-store";

interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data: { success: boolean; data?: NotificationsResponse; error?: { message: string } } =
        await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? "Failed to load notifications");
      }
      setItems(data.data?.items ?? []);
      setUnreadCount(data.data?.unreadCount ?? 0);
    } catch (err) {
      console.error("[notifications] failed to load:", err);
      toast.error("Notifications are unavailable right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleOpenChange(next: boolean): void {
    setOpen(next);
    if (next && unreadCount > 0) {
      fetch("/api/notifications/read-all", { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUnreadCount(0);
            setItems((current) =>
              current.map((item) => ({
                ...item,
                read_at: item.read_at ?? new Date().toISOString(),
              })),
            );
          }
        })
        .catch(() => toast.error("Failed to clear notifications"));
    }
  }

  function formatDate(value: string): string {
    const date = new Date(value);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          className="relative"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground tabular-nums">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-3 py-2 text-sm font-medium">Notifications</div>
        <ul className="max-h-80 overflow-y-auto">
          {loading && (
            <li className="flex items-center justify-center px-3 py-8 text-sm text-muted-foreground">
              Loading...
            </li>
          )}
          {!loading && items.length === 0 && (
            <li className="flex items-center justify-center px-3 py-8 text-sm text-muted-foreground">
              No notifications yet.
            </li>
          )}
          {!loading &&
            items.map((item) => (
              <li
                key={item.id}
                className={`border-b border-border px-3 py-2.5 ${item.read_at ? "" : "bg-muted/50"}`}
              >
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${item.read_at ? "text-muted-foreground" : ""}`}
                  >
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.message}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatDate(item.created_at)}
                  </p>
                </div>
              </li>
            ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
