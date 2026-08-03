# Lib (AppGen)

`src/lib/` is for shared utilities used across the app. Keep this layer small and dependency-light.

## What belongs here

- Generic helpers (`cn`, parsing helpers, constants).
- Cross-feature utilities that are not domain-specific.
- Server-safe wrappers that are intentionally shared (for example DB bootstrap helpers used by server code).

## What does not belong here

- Feature business logic (put in domain hooks/services/routers).
- UI components (put in `src/components`).
- Server endpoint logic (put in `src/server/**` or `src/services/**`).

## Boundaries

- Do not import server-only modules into client-safe utilities.
- For server-only files in `lib`, keep `@tanstack/react-start/server-only` at the top.
- Keep utilities deterministic and easy to test.

## Constants and configuration

- Centralize user-visible branding/config in constants (for example `APP_NAME`, `APP_DESCRIPTION`).
- Avoid hardcoding one-off values inside route components when a constant is appropriate.

S3 storage helpers live in `src/server/s3/` — see [`src/server/AGENTS.md`](../server/AGENTS.md) for the API, refresh model, and safety rules.
