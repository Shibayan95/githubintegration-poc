import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { TRPCClientError } from "@trpc/client";
import { routeTree } from "./routeTree.gen";
import { trpc } from "@/integrations/trpc/react";
import { createTrpcClient } from "@/integrations/trpc/createTrpcClient";

function isUnauthorizedTrpcError(error: unknown) {
  return (
    error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED"
  );
}

function handleTrpcAuthError(error: unknown) {
  if (typeof window === "undefined") return;
  if (!isUnauthorizedTrpcError(error)) return;
  if (window.location.pathname === "/sign-in") return;
  window.location.assign("/sign-in");
}

export function getRouter() {
  const trpcClient = createTrpcClient();
  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: handleTrpcAuthError }),
    mutationCache: new MutationCache({ onError: handleTrpcAuthError }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    Wrap: ({ children }) => (
      <trpc.TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </trpc.TRPCProvider>
    ),
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
