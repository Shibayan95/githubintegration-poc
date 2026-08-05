import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { getAuthState } from "@/server/auth";

// All routes nested under /_protected require authentication.
// This route acts as a layout guard — unauthenticated users are redirected to /sign-in.
export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    // Parse the current URL's query string to inspect for an SSO token.
    const params = new URLSearchParams(location.searchStr);
    const authToken = params.get("authToken");

    if (authToken) {
      // Strip the authToken from the URL before processing it via /iframe-auth,
      // so the token is never exposed in the browser's address bar after login.
      const cleanSearch = Array.from(params.entries())
        .filter(([k]) => k !== "authToken")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
      const redirectTo = `${location.pathname}${cleanSearch ? `?${cleanSearch}` : ""}${location.hash}`;
      // Hand off to the iframe-auth handler, which sets the auth cookie and
      // then bounces the user back to their original destination.
      throw redirect({
        to: "/iframe-auth",
        search: { authToken, redirect: redirectTo || "/" },
        replace: true,
      });
    }

    // Validate the session server-side; redirect to sign-in if not authenticated.
    const auth = await getAuthState();
    if (!auth.allowed) {
      throw redirect({ to: "/sign-in", replace: true });
    }
  },
  component: ProtectedLayout,
});

// Wraps all authenticated pages in the shared app shell (sidebar + header).
function ProtectedLayout() {
  return (
    <AppLayout>
      {/* Render the matched child route here */}
      <Outlet />
    </AppLayout>
  );
}
