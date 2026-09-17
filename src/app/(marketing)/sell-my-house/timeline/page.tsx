import type { Metadata } from "next";
import { TimelineScreen } from "./timeline-screen";

export const metadata: Metadata = {
  title: "Your Timeline",
  robots: { index: false, follow: true },
};

export default function TimelineStepPage() {
  return <TimelineScreen />;
}
