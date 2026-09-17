import type { Metadata } from "next";
import { Container } from "@/components/ui/layout";
import { StartScreen } from "./start-screen";

export const metadata: Metadata = {
  title: "Let's Learn About Your Home",
  description: "A short set of questions about your property. About two minutes, no obligation.",
  // Funnel steps are working screens, not landing pages. /sell-my-house is the
  // indexable entry point.
  robots: { index: false, follow: true },
};

export default function FunnelStartPage() {
  return (
    <Container size="narrow" className="py-12 sm:py-20">
      <StartScreen />
    </Container>
  );
}
