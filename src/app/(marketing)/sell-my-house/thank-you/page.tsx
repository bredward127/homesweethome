import type { Metadata } from "next";
import { ThankYouScreen } from "./thank-you-screen";

export const metadata: Metadata = {
  title: "Thank You",
  robots: { index: false, follow: true },
};

export default function ThankYouPage() {
  return <ThankYouScreen />;
}
