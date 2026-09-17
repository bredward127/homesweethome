"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  ChartNoAxesColumn,
  CircleCheck,
  FileSignature,
  FolderLock,
  Handshake,
  Home,
  Inbox,
  LayoutDashboard,
  ScrollText,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { appNav } from "@/config/app-nav";
import { hasAnyPermission, type Role } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Inbox,
  Home,
  Users,
  CircleCheck,
  Calendar,
  FileSignature,
  FolderLock,
  Handshake,
  ChartNoAxesColumn,
  Settings,
  ScrollText,
};

/**
 * Permission-aware sidebar.
 *
 * Items the user has no permission for are omitted entirely; items not yet
 * built render as disabled placeholders so the team can see the shape of the
 * workspace without landing on a 404.
 */
export function AppNav({ roles, onNavigate }: { roles: Role[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  const groups = React.useMemo(
    () =>
      appNav
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => hasAnyPermission(roles, item.permissions)),
        }))
        .filter((group) => group.items.length > 0),
    [roles],
  );

  return (
    <nav aria-label="Workspace" className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.label}>
          <h2 className="px-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
            {group.label}
          </h2>
          <ul className="mt-2 flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon] ?? LayoutDashboard;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const children = item.children?.filter((child) =>
                hasAnyPermission(roles, child.permissions),
              );

              return (
                <li key={item.href}>
                  {item.status === "ready" ? (
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[0.9375rem] font-medium transition-colors",
                        isActive
                          ? "bg-sage-100 text-sage-800"
                          : "text-ink-700 hover:bg-cream-200 hover:text-ink-900",
                      )}
                    >
                      <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      title={`${item.label} is not built yet`}
                      className="flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2 text-[0.9375rem] font-medium text-ink-500/70"
                    >
                      <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                      {item.label}
                      <span className="ml-auto rounded-full bg-cream-200 px-2 py-0.5 text-[0.6875rem] font-semibold text-ink-500">
                        Soon
                      </span>
                    </span>
                  )}

                  {isActive && children && children.length > 0 ? (
                    <ul className="ml-6 mt-0.5 flex flex-col gap-0.5 border-l border-cream-300 pl-3">
                      {children.map((child) => (
                        <li key={child.href}>
                          <span className="block rounded-lg px-2.5 py-1.5 text-sm text-ink-500/70">
                            {child.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
