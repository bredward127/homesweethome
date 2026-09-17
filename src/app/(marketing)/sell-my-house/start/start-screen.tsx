"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FunnelDisclosure } from "@/components/marketing/funnel-disclosure";
import { useFunnel } from "@/components/funnel/funnel-provider";
import { stepHref } from "@/lib/leads/funnel-steps";
import { trackEvent } from "@/lib/analytics/ga";
import { deviceCategory } from "@/lib/leads/attribution";

const reassurances = [
  { icon: Clock, text: "About two minutes, and you can stop at any point." },
  { icon: Lock, text: "Nothing is sent to us until you choose to share your contact details." },
  { icon: ShieldCheck, text: "Most questions are optional. Share only what you want to." },
];

/** Screen 1 — the intro. Sets expectations before asking for anything. */
export function StartScreen() {
  const router = useRouter();
  const { draft, hydrated } = useFunnel();

  const hasDraft = hydrated && Object.keys(draft).length > 0;

  const start = () => {
    trackEvent("funnel_started", { device_category: deviceCategory() });
    router.push(stepHref("address"));
  };

  return (
    <div className="flex flex-col items-start gap-6">
      <Badge tone="sage" className="gap-1.5">
        <Clock className="size-3.5" aria-hidden="true" />
        Start in under 2 minutes
      </Badge>

      <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        Let&rsquo;s learn a little about your home.
      </h1>

      <p className="text-lg leading-relaxed text-ink-600">
        This takes about two minutes. Your answers help us prepare for a useful conversation
        &mdash; they are not a commitment to anything.
      </p>

      <ul className="flex w-full flex-col gap-3">
        {reassurances.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-start gap-3 rounded-xl border border-cream-300 bg-cream-50 px-5 py-4"
          >
            <Icon className="mt-0.5 size-5 shrink-0 text-sage-600" aria-hidden="true" />
            <span className="text-[0.9375rem] leading-relaxed text-ink-700">{text}</span>
          </li>
        ))}
      </ul>

      <div className="flex w-full flex-col gap-3 sm:w-auto">
        <Button size="lg" onClick={start} className="sm:min-w-56">
          {hasDraft ? "Pick up where you left off" : "Get Started"}
        </Button>
        {hasDraft ? (
          <p className="text-sm text-ink-500">
            We saved your answers on this device so you don&rsquo;t have to start over.
          </p>
        ) : null}
      </div>

      <FunnelDisclosure />
    </div>
  );
}
