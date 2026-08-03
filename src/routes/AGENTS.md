# Routes (AppGen)

Use this guide when creating or editing route pages in `src/routes/`.

## Route conventions

- Create routes with `createFileRoute` and keep files focused on page composition.
- Do not edit `src/routeTree.gen.ts` manually (auto-generated).
- **The home route `_protected/index.tsx` is the app's main page.** It ships as a "Welcome…" placeholder and is what the preview opens to (`/`). Build the primary/first page by replacing this file directly — never leave the placeholder, and never put the main page on a separate route while `/` still shows "Welcome…". Rename the matching `Dashboard` entry in `src/components/layout/index.ts` instead of adding a duplicate `/` entry.
- For sidebar pages, add/update the route entry in `src/components/layout/index.ts` so nav and breadcrumbs stay in sync.
- Keep user-facing copy plain and short. AppGen users are non-technical.

## Maintainability rules

- Do not hardcode tenant-specific values (repo names, IDs, account names, URLs) directly in UI text or API calls. If the user provides a URL or repo name as part of their request, put it in a typed constant at the top of the server router file (or better, a `z.url()` procedure input) — never paste it directly into JSX text or hardcode it in two places. UI display labels should derive from the same source, not be re-typed.
- For tRPC procedure calls in routes: follow the `useTRPC` + `queryOptions`/`mutationOptions` pattern. See `src/integrations/trpc/AGENTS.md` for the required usage.
- Prefer existing hooks/services first; avoid adding duplicate fetch logic in route files.
- If a page repeats card/row/section markup, use a typed config array or small reusable component.
- Every data page must explicitly handle loading, empty, success, and error states.
- Keep route files readable; split large pages into local view components/hooks when needed.

## Feature handoff notes (required)

When you add a new feature route, append a short subsection here with:

1. Goal and user-visible behavior.
2. Data flow (UI -> hook/service -> API/DB).
3. Inputs/configuration (route params, constants, env, IDs).
4. Constraints or known limitations.
5. Validation commands run (`bun run check`, `bun run build`, `bun run test`).

**Definition of done:** The feature is not complete until the Feature notes subsection below is updated with actual content (not the placeholder line). Writing "Let me update the AGENTS" without then editing this file does not count.

## Feature notes

_No feature notes yet. Add the first one when the next route-level feature is implemented._
