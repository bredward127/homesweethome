import type { Metadata } from "next";
import { ConditionScreen } from "./condition-screen";

export const metadata: Metadata = {
  title: "Property Condition",
  robots: { index: false, follow: true },
};

export default function ConditionStepPage() {
  return <ConditionScreen />;
}
