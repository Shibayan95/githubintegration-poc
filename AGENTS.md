# AppGen Template

React app in a coding sandbox. Generated code is shown to end users as a live application.

## Critical Rules

- **Audience is non-technical.** Describe changes in terms of what users see. Implement everything — don't explain the plan.
- **OpenCode runs in API mode** — produce complete, self-contained responses.
- **Do exactly what is asked — no more.** Match scope precisely.
- **Load `frontend-design` skill ONLY for UI pages** — skip for DB/backend tasks.
- **Never start a dev server** — one is already running on port 5173.
- **Do not run `bun install`** — dependencies are pre-installed.
- **Package manager is bun.** Use `bun run`, `bunx`. Replace `npx` with `bunx`.
- **Import `createServerFn` from `@tanstack/react-start`** — NOT `@tanstack/start`. Build error otherwise.
- **Use `.inputValidator()`, never `.validator()`** — runtime crash.
- **Use `method: "POST"` for all mutations** — no DELETE support.
- **Never use `pgEnum`** — use `text("col").$type<"a" | "b">()` instead.
- **Never run `drizzle-kit push`** — hangs. Use `bun run db:generate` + `bun run db:migrate`.
- **Always use Neon database for data storage.** Never in-memory arrays, `useState<Array>`, `Map`, `localStorage`.
- **Auth is platform-only.** Do not build standalone auth (no users table, no bcryptjs, no password hashing).
- **Do not change the font (Manrope).**

## Common Mistakes

- **`.validator()` → crash.** Use `.inputValidator()`.
- **`@tanstack/start` → build error.** Use `@tanstack/react-start`.
- **`pgEnum()` → migration fails.** Use `text("col").$type<"a" | "b">()`.
- **`drizzle-kit push` → hangs.** Use `bun run db:generate` then `bun run db:migrate`.
- **Module-level import of `@/lib/db` or `@/env` → client bundle error.** Dynamic-import inside handlers only.
- **`method: "DELETE"` → 405.** Use `method: "POST"` for all mutations.
- **`relations()` missing → empty data, no error.** Declare for both sides.
- **Raw `integer()` without `.references()` → not a real FK.**
- **In-memory store → data lost on refresh.** Always use Neon DB.
- **`npx` → creates package-lock.json.** Use `bunx`.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (React 19, SSR) |
| Language | TypeScript (strict) |
| Bundler | Vite 7 |
| Routing | TanStack Router (file-based) |
| UI | shadcn/ui, Tailwind CSS v4 |
| Icons | Tabler Icons (`@tabler/icons-react`) |
| Forms | TanStack Form, Zod |
| Charts | Recharts |
| DB | Drizzle ORM + Neon HTTP (`@neondatabase/serverless`) |
| State | None — no app-level stores |
| Linting | Biome |

## Server Functions

**All server calls use `createServerFn`** from `@tanstack/react-start`. Dynamic-import dependencies inside handlers:

```tsx
export const listItems = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("@/lib/db");
  const { items } = await import("@/server/db/schema");
  const { desc } = await import("drizzle-orm");
  const db = await getDb();
  return db.select().from(items).orderBy(desc(items.createdAt));
});

export const createItem = createServerFn({ method: "POST" })
  .inputValidator((input: { name: string }) => input)
  .handler(async ({ data }) => {
    const { getDb } = await import("@/lib/db");
    const { items } = await import("@/server/db/schema");
    const db = await getDb();
    const [row] = await db.insert(items).values(data).returning();
    return row;
  });

export const deleteItem = createServerFn({ method: "POST" })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    const { getDb } = await import("@/lib/db");
    const { items } = await import("@/server/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    await db.delete(items).where(eq(items.id, id));
  });
```

## Application Layout

- **`__root.tsx`** — auth guard in `beforeLoad`. Never remove it.
- **Home route is the app's main page — replace the placeholder.** `src/routes/_protected/index.tsx` ships as a "Welcome to {APP_NAME}" placeholder. The preview always opens at `/`, so the FIRST/primary page you build MUST be edited directly into `_protected/index.tsx` — never leave the placeholder, and never build the main page as a separate route while `/` still shows "Welcome…". The user must see their generated app at `/`, not an empty Dashboard.
- **Keep the nav in sync with the home route.** When `/` becomes the main page, rename the default `routes` entry in `src/components/layout/index.ts` (title/icon) to match it — do not add a second entry that duplicates `/`. Only add new `routes` entries for genuinely separate secondary pages.
- Additional pages: `src/routes/<name>.tsx` with `createFileRoute`, then add a nav entry to `src/components/layout/index.ts`.
- Use `data-flush` for full-page layouts (removes padding).

## Database (Drizzle + Neon HTTP)

Enabled when `DATABASE_URL` is set. Apps without DB boot normally.

### When to provision

| Signal | Action |
|---|---|
| "save", "store", "track", CRUD, records | Call `agentic_coding_request_database` MCP tool first |
| Ephemeral UI state, toggles | `useState` / `useReducer` |

### Provisioning

```
agentic_coding_request_database(app_id: "<value of $APPGEN_APP_ID env var>")
```

Idempotent. Do not ask for confirmation — execute directly.

### After provisioning — exact order

1. `bun run db:status` — must print `state=connected`
2. Define tables in `src/server/db/schema.ts` (single file)
3. `bun run db:generate`
4. `bun run db:migrate`
5. `bun run db:status` — verify table in list
6. Write service in `src/services/db/<domain>Service.ts`
7. Wire UI with `useQuery`/`useMutation`. Gate with `useCapabilities()`.

### Schema example

```typescript
import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  status: text("status").$type<"open" | "done">().notNull().default("open"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
```

### Relations (only when needed)

```typescript
import { relations } from "drizzle-orm";

export const authorsRelations = relations(authors, ({ many }) => ({ posts: many(posts) }));
export const postsRelations = relations(posts, ({ one }) => ({
  author: one(authors, { fields: [posts.authorId], references: [authors.id] }),
}));
```

Both sides required. Without `relations()`, `with: { ... }` returns nothing silently.

### Files you own

- `src/server/db/schema.ts`, `src/server/db/migrations/`, `src/services/db/<domain>Service.ts`

### Files you DON'T touch

- `src/lib/db.ts`, `drizzle.config.ts`, `src/server/db/migrate.ts`, `src/server/db/status.ts`, `.env.local`

### DB-backed page pattern

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCapabilities } from "@/hooks/useCapabilities";
import { listItems, deleteItem } from "@/services/db/itemService";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/items")({ component: ItemsPage });

function ItemsPage() {
  const queryClient = useQueryClient();
  const { data: caps, isLoading: capsLoading } = useCapabilities();
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => listItems(),
    enabled: caps?.databaseEnabled === true,
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteItem({ data: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });

  if (capsLoading) return <Skeleton className="h-64 w-full" />;
  if (!caps?.databaseEnabled) return <p>Database not configured.</p>;
  if (itemsLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div>
      {items?.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

Rules:
- All hooks MUST be called before any early return.
- Use `enabled: caps?.databaseEnabled === true` to skip DB queries when DB is off.
- Use `<Skeleton>` for loading states.
- Invalidate queries after mutations.

## S3 Object Storage (Bun.s3)

Enabled when the platform has provisioned storage and credentials are present. Apps without storage boot normally. Credentials are temporary STS tokens auto-refreshed by the platform — **never hardcode them**.

### CRITICAL: Provision BEFORE writing any S3 code

**Before writing ANY code that uses file uploads, images, photos, documents, PDFs, CSVs, or the S3 helpers, you MUST first call the MCP tool to provision storage. If you skip this step, the app will crash because S3 credentials won't exist.**

Read the value of `APPGEN_APP_ID` from the environment, then call:
```
agentic_coding_create_storage(app_id: "<the APPGEN_APP_ID value>")
```

To get the app ID, run: `echo $APPGEN_APP_ID` in the terminal.

This is the FIRST thing you do — before creating any service files, components, or routes that involve files. Idempotent — safe to call even if already provisioned. Do not ask for confirmation.

Same pattern as database: you call `agentic_coding_request_database` before writing DB code. You call `agentic_coding_create_storage` before writing file upload code.

### Folder conventions

| Folder | Who writes | Notes |
|---|---|---|
| `assets/` | Agent at dev time | Static assets (logos, icons, fonts). Public — direct S3 URL. |
| `uploads/` | App code at runtime | User uploads. Private — presigned URL. **Agent never touches files here.** |
| `exports/` | App code at runtime | App-generated reports/CSVs. Private. Agent generates code only. |

Safety is enforced by **convention** (this file) + S3 bucket versioning as the recovery net.

### Storage-backed page pattern

Gate UI on the capability flag — same shape as `databaseEnabled`:

```tsx
import { useCapabilities } from "@/hooks/useCapabilities";

function AvatarUploader() {
  const { data: caps } = useCapabilities();
  if (!caps?.s3Enabled) return <p>Storage not configured.</p>;
  // ...upload UI
}
```

For the helper API (`uploadFile`, `downloadFile`, `deleteFile`, `getPresignedUrl`, `refreshS3Credentials`), refresh model, and safety rules see [`src/server/AGENTS.md`](src/server/AGENTS.md).

## Platform Integration

- **Auth**: Platform-based only via `getAuthState()` in `__root.tsx`. Hook: `useSignIn`, `useSignOut`, `useGetUser` (tRPC, calls platform API).
- **Connectors**: `useConnectors(params?)`, `useConnector(id)`, `useQuerySource()` (mutation, not query).
- **Workflows**: `useRunWorkflow(workflowId)`.
- **Chat**: `<ChatAssistant workflowId={id} />` — one component, one prop. See `src/components/chat/`.
- **MCP tools**: The `aisquared` MCP provides platform connectors, workflows, and DB provisioning.

## Coding Standards

- Use `@/` alias for imports. Prefer shadcn components over raw HTML.
- Tailwind utilities + `cn()`. No inline styles.
- TypeScript strict; no `any`.
- Biome for linting. Run `bun run check`.
- No render-time side effects. Use `useEffect`/handlers.

## Commands

```bash
bun run build        # production build
bun run check        # Biome lint + format
bun run test         # Vitest
bun run db:generate  # SQL migration from schema diff
bun run db:migrate   # Apply migrations via Neon HTTP
bun run db:status    # DB state + table list
```
