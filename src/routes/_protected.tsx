import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { getAuthState } from "@/server/auth";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    const params = new URLSearchParams(location.searchStr);
    const authToken = params.get("authToken");
    if (authToken) {
      const cleanSearch = Array.from(params.entries())
        .filter(([k]) => k !== "authToken")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
      const redirectTo = `${location.pathname}${cleanSearch ? `?${cleanSearch}` : ""}${location.hash}`;
      throw redirect({
        to: "/iframe-auth",
        search: { authToken, redirect: redirectTo || "/" },
        replace: true,
      });
    }
    const auth = await getAuthState();
    if (!auth.allowed) {
      throw redirect({ to: "/sign-in", replace: true });
    }
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
