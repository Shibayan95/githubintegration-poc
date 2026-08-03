import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/constants";

// PLACEHOLDER HOME PAGE — this is the app root (`/`) and what the preview opens to.
// When building the app's primary page, REPLACE this component with the real page
// (and update the matching "Dashboard" entry in `src/components/layout/index.ts`).
// Do NOT leave this "Welcome…" placeholder in place, and do NOT build the main page
// as a separate route while `/` still renders this.

export const Route = createFileRoute("/_protected/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Welcome to {APP_NAME}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Start building your app here.
        </p>
      </div>
    </div>
  );
}
