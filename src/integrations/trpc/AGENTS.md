# tRPC Integration (AppGen)

This folder wires tRPC into TanStack Start (context, client, react bindings, root router).

## Responsibilities

- `context.ts`: build `TRPCContext` from request headers/cookies.
- `init.ts`: tRPC init, transformer, middleware, and exported procedure helpers.
- `router.ts`: root router composition from domain routers.
- `createTrpcClient.ts`: client transport (`/api/trpc`) for SSR + browser.
- `react.tsx`: React Query/tRPC context binding (`trpc`).

## Guardrails

- Keep auth middleware centralized in `init.ts`.
- Preserve `superjson` on both server and client sides.
- For SSR, keep cookie forwarding behavior so protected procedures work server-side.
- Do not hardcode absolute API hostnames; rely on request origin + `/api/trpc`.

## Using tRPC in React (routes and components)

`react.tsx` exports `trpc` from `createTRPCContext` — this is **not** a bag of procedure hooks. Calling `trpc.foo.bar.useQuery()` directly is **wrong** and causes a runtime `Cannot read properties of undefined` error.

The correct pattern for every route and component that calls a tRPC procedure:

```tsx
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/integrations/trpc/react";

// Inside a component:
const t = trpc.useTRPC();

// Query
// @ts-expect-error — tRPC + React Query option merge
const { data, isLoading } = useQuery(t.myDomain.list.queryOptions());

// Mutation (merge extra options with spread)
// @ts-expect-error — tRPC + React Query option merge
const mutation = useMutation({
  ...t.myDomain.create.mutationOptions(),
  onSuccess: (result) => { /* ... */ },
  onError: (err) => { /* ... */ },
});
```

Never write `trpc.foo.bar.useQuery()`, `trpc.foo.bar.useMutation()`, or `trpc.foo.bar.useInfiniteQuery()` — these do not exist on the context object.

## Extending

- New domain router: create in `src/server/trpc/routers/` and register in `router.ts`.
- Keep transport/client setup generic and reusable; avoid feature-specific logic here.
