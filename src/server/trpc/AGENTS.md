# tRPC Server (AppGen)

Use this guide for files in `src/server/trpc/routers/`.

## Router conventions

- Keep one router per domain (`auth`, `connectors`, `workflows`, etc.).
- Register new routers in `src/integrations/trpc/router.ts`.
- Use `publicProcedure` only for true public endpoints; default to `protectedProcedure`.

## Input/output contracts

- Validate all inputs with Zod (`.input(...)`) on every procedure that accepts input.
- Return typed, predictable payloads; avoid ad-hoc response shapes.
- Do not cast untrusted API responses directly without guards in write paths.
- **Third-party HTTP (GitHub, external APIs):** parse the JSON response with a Zod schema before any DB write. Never use `as SomeType[]` — if the shape is wrong, you need to know before inserting. Externally-supplied URLs or identifiers belong in the procedure `.input(z.object({ url: z.url(), ... }))` or a typed server-side constant, not hardcoded in the procedure body.

## Error handling

- Throw `TRPCError` with the closest correct code (`UNAUTHORIZED`, `BAD_REQUEST`, etc.).
- Keep error messages safe for end users; do not include secrets or internal diagnostics.
- When a third-party HTTP call fails (non-2xx), throw `new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "..." })` — not a raw `new Error(...)`, which bypasses tRPC's error serialization.

## Query/mutation hygiene

- Query procedures should be side-effect free.
- Mutation procedures should be idempotent when practical (for retries).
- Move repeated mapping logic into local helpers when a procedure grows.

## Auth and context

- Use `ctx.authToken` from `TRPCContext` (do not parse cookies in routers).
- Let middleware in `src/integrations/trpc/init.ts` enforce auth behavior.
