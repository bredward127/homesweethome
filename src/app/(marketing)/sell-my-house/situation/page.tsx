import type { Metadata } from "next";
import { SituationScreen } from "./situation-screen";

export const metadata: Metadata = {
  title: "Your Situation",
  robots: { index: false, follow: true },
};

export default function SituationStepPage() {
  return <SituationScreen />;
}
