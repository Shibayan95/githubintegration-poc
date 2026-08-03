# Services

Server functions via `createServerFn` from `@tanstack/react-start`.

## Rules

- Use `.inputValidator()`, never `.validator()` (crashes).
- Use `method: "POST"` for mutations (no DELETE).
- Dynamic-import `@/lib/db`, `@/server/db/schema`, `drizzle-orm` inside handlers.
- Dynamic-import `@/lib/apiFetch` for platform API calls.

## DB Services (`src/services/db/`)

Place CRUD services here. Pattern:

```ts
import { createServerFn } from "@tanstack/react-start";

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

## Platform API Services

- **`@/lib/apiFetch`** — Platform API. Auto-sets auth + workspace. Import only inside handlers.
- **`connectors/`** — `listConnectors`, `getConnector`, `querySource`.
- **`workflows/`** — `runWorkflow`, `getWorkflowDataAppConfig`.

## Capabilities

- **`src/services/capabilitiesService.ts`** — `getCapabilities()` checks if DATABASE_URL is set.
