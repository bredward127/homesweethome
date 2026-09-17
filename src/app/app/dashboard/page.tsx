import type { Metadata } from "next";
import { Inbox, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { KpiCard } from "@/components/app/kpi-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, hasPermission } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

/**
 * Phase 1 dashboard.
 *
 * The KPI tiles are in place with zeroed values because the tables they
 * summarise (leads, tasks, appointments, contracts) arrive in later phases.
 * They read zero rather than showing invented numbers, so nobody mistakes
 * scaffolding for live data.
 */
export default async function DashboardPage() {
  const user = await requireUser("/app/dashboard");
  const firstName = user.fullName?.split(" ")[0] ?? "there";

  const kpis = [
    { label: "New leads today", value: 0, hint: "Seller submissions received since midnight." },
    { label: "Hot leads needing contact", value: 0, hint: "Tier Hot with no completed call yet.", tone: "attention" as const },
    { label: "Calls booked today", value: 0, hint: "Appointments scheduled to start today." },
    { label: "Contracts pending signature", value: 0, hint: "Sent for signature or partially signed." },
    { label: "Active contracts", value: 0, hint: "Executed and not yet closed or cancelled." },
    { label: "Follow-ups overdue", value: 0, hint: "Tasks past their due time and not complete.", tone: "attention" as const },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Good to see you, ${firstName}`}
        description="Your workspace overview. Pipeline figures populate as leads come in."
      />

      <Alert tone="info" title="Workspace foundation">
        Authentication, roles, and the security model are live. Lead capture, the seller funnel,
        and the pipeline modules are being built in the phases that follow, so the tiles below
        read zero rather than showing sample data.
      </Alert>

      <section aria-labelledby="kpis">
        <h2 id="kpis" className="sr-only">
          Key figures
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              hint={kpi.hint}
              tone={kpi.tone}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="recent-leads" className="lg:col-span-2">
          <h2 id="recent-leads" className="mb-3 text-lg font-semibold tracking-tight">
            Recent seller leads
          </h2>
          <EmptyState
            icon={<Inbox className="size-7" />}
            title="No leads yet"
            description="Seller submissions from the public funnel will land here the moment lead capture goes live."
          />
        </section>

        <section aria-labelledby="your-access">
          <h2 id="your-access" className="mb-3 text-lg font-semibold tracking-tight">
            Your access
          </h2>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4.5 text-sage-600" aria-hidden="true" />
                Role and permissions
              </CardTitle>
              <CardDescription>
                What your account can reach. Ask an admin if something looks wrong.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-2">
              {user.roles.map((role) => (
                <div key={role} className="flex flex-col gap-1.5">
                  <Badge tone="sage" className="self-start">
                    {ROLE_LABELS[role]}
                  </Badge>
                  <p className="text-sm leading-relaxed text-ink-600">
                    {ROLE_DESCRIPTIONS[role]}
                  </p>
                </div>
              ))}

              {hasPermission(user.roles, "settings:write") ? (
                <p className="border-t border-cream-300 pt-3 text-sm text-ink-600">
                  You can change business settings, scoring rules, and team roles. Those changes
                  are recorded in the audit log.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
