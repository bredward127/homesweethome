import type { Metadata } from "next";
import { getBookingProvider, demoAppointmentSlots } from "@/lib/integrations/booking";
import { BookCallScreen } from "./book-call-screen";

export const metadata: Metadata = {
  title: "Your Next Step",
  robots: { index: false, follow: true },
};

/**
 * Screen 9 — the booking decision.
 *
 * The provider is resolved on the server so no booking configuration reaches
 * the browser, and the demo slots are generated here so they are stable for
 * the render.
 */
export default function BookCallStepPage() {
  const provider = getBookingProvider();
  const slots = provider.kind === "in_app" ? demoAppointmentSlots() : [];

  return (
    <BookCallScreen
      provider={provider.kind}
      bookingUrl={provider.kind === "in_app" ? null : provider.url}
      demoSlots={slots.map((slot) => slot.toISOString())}
    />
  );
}
