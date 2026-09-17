import type { Metadata } from "next";
import { ReviewScreen } from "./review-screen";

export const metadata: Metadata = {
  title: "Review Your Answers",
  robots: { index: false, follow: true },
};

export default function ReviewStepPage() {
  return <ReviewScreen />;
}
