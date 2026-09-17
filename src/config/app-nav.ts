import type { Permission } from "@/lib/auth/roles";

/**
 * Internal CRM navigation.
 *
 * `permissions` drives what each role sees — an item is rendered only if the
 * user holds at least one of them. Hiding a link is a usability measure, not a
 * security one: the route itself re-checks authorization server-side and RLS
 * governs the data underneath.
 *
 * `status` reflects build progress. Sections land in the phase noted against
 * them; until then the item renders as a non-interactive placeholder so the
 * team can see the intended shape of the workspace without hitting a 404.
 */
export type AppNavItem = {
  href: string;
  label: string;
  /** Lucide icon name, resolved in the nav component. */
  icon: string;
  permissions: readonly Permission[];
  status: "ready" | "planned";
  /** Child links shown when the section is active. */
  children?: readonly Omit<AppNavItem, "icon" | "children">[];
};

export type AppNavGroup = {
  label: string;
  items: readonly AppNavItem[];
};

export const appNav: readonly AppNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/app/dashboard",
        label: "Dashboard",
        icon: "LayoutDashboard",
        permissions: ["leads:read", "reports:read"],
        status: "ready",
      },
    ],
  },
  {
    label: "Pipeline",
    items: [
      {
        href: "/app/leads",
        label: "Leads",
        icon: "Inbox",
        permissions: ["leads:read"],
        status: "planned",
      },
      {
        href: "/app/properties",
        label: "Properties",
        icon: "Home",
        permissions: ["properties:read"],
        status: "planned",
      },
      {
        href: "/app/contacts",
        label: "Contacts",
        icon: "Users",
        permissions: ["contacts:read"],
        status: "planned",
      },
    ],
  },
  {
    label: "Work",
    items: [
      {
        href: "/app/tasks",
        label: "Tasks",
        icon: "CircleCheck",
        permissions: ["tasks:read"],
        status: "planned",
      },
      {
        href: "/app/calendar",
        label: "Calendar",
        icon: "Calendar",
        permissions: ["appointments:read"],
        status: "planned",
      },
    ],
  },
  {
    label: "Deals",
    items: [
      {
        href: "/app/contracts",
        label: "Contracts",
        icon: "FileSignature",
        permissions: ["contracts:read"],
        status: "planned",
      },
      {
        href: "/app/documents",
        label: "Documents",
        icon: "FolderLock",
        permissions: ["documents:read"],
        status: "planned",
      },
      {
        href: "/app/dispositions",
        label: "Dispositions",
        icon: "Handshake",
        permissions: ["dispositions:read"],
        status: "planned",
      },
    ],
  },
  {
    label: "Insight",
    items: [
      {
        href: "/app/reports",
        label: "Reports",
        icon: "ChartNoAxesColumn",
        permissions: ["reports:read"],
        status: "planned",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        href: "/app/settings",
        label: "Settings",
        icon: "Settings",
        permissions: ["settings:read"],
        status: "planned",
        children: [
          { href: "/app/settings/team", label: "Team", permissions: ["team:read"], status: "planned" },
          { href: "/app/settings/funnel", label: "Funnel", permissions: ["settings:write"], status: "planned" },
          { href: "/app/settings/service-areas", label: "Service Areas", permissions: ["settings:write"], status: "planned" },
          { href: "/app/settings/integrations", label: "Integrations", permissions: ["settings:write"], status: "planned" },
          { href: "/app/settings/templates", label: "Templates", permissions: ["settings:write"], status: "planned" },
        ],
      },
      {
        href: "/app/audit-log",
        label: "Audit Log",
        icon: "ScrollText",
        permissions: ["audit:read"],
        status: "planned",
      },
    ],
  },
];
