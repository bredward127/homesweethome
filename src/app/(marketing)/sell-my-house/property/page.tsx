import type { Metadata } from "next";
import { PropertyScreen } from "./property-screen";

export const metadata: Metadata = {
  title: "About the Property",
  robots: { index: false, follow: true },
};

/**
 * Screens 2 and 3 — property address, then property basics.
 *
 * Both live on this route with a `?stage=` parameter, so each question still
 * gets its own screen while the browser Back button behaves as expected.
 */
export default async function PropertyStepPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage } = await searchParams;
  return <PropertyScreen stage={stage === "basics" ? "basics" : "address"} />;
}
