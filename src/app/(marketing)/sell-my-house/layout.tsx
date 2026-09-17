import { FunnelProvider } from "@/components/funnel/funnel-provider";

/**
 * Wraps the seller funnel in its draft-state provider.
 *
 * Also covers the /sell-my-house landing page, which is harmless — the
 * provider only holds state and does not render anything of its own.
 */
export default function SellMyHouseLayout({ children }: { children: React.ReactNode }) {
  return <FunnelProvider>{children}</FunnelProvider>;
}
