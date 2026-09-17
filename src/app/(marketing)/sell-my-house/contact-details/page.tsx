import type { Metadata } from "next";
import { ContactDetailsScreen } from "./contact-details-screen";

export const metadata: Metadata = {
  title: "How Should We Reach You?",
  robots: { index: false, follow: true },
};

export default function ContactDetailsStepPage() {
  return <ContactDetailsScreen />;
}
