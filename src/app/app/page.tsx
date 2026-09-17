import { redirect } from "next/navigation";

/** /app is an alias for the dashboard. */
export default function AppIndexPage() {
  redirect("/app/dashboard");
}
