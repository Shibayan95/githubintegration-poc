import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createIsomorphicFn } from "@tanstack/react-start";
import superjson from "superjson";
import type { TRPCAppRouter } from "./router";

const getTrpcRequestContext = createIsomorphicFn()
  .client(() => ({ origin: window.location.origin }))
  .server(async () => {
    const { getRequestHeader, getRequestUrl } = await import(
      "@tanstack/react-start/server"
    );
    return {
      origin: getRequestUrl().origin,
      cookie: getRequestHeader("cookie"),
    };
  });

/**
 * tRPC over HTTP. On SSR, forward the incoming browser cookie header to the
 * internal `/api/trpc` request so auth procedures see `appgenAuthToken`.
 */
export function createTrpcClient() {
  return createTRPCClient<TRPCAppRouter>({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
        fetch: async (url, init) => {
          const context = await getTrpcRequestContext();
          const headers = new Headers(init?.headers);

          if ("cookie" in context && context.cookie) {
            headers.set("Cookie", context.cookie);
          }

          return fetch(new URL(String(url), context.origin), {
            ...init,
            headers,
            credentials: "include",
          });
        },
      }),
    ],
  });
}
