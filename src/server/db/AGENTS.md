# Database (AppGen)

Use this guide for `src/server/db/schema.ts` and `src/server/db/migrations/`.

## Schema conventions

- Keep `schema.ts` as the single source of truth for table definitions.
- Use snake_case column names in DB and clear camelCase field names in code.
- Add constraints intentionally: `notNull`, `unique`, defaults, and indexes where needed.
- Prefer explicit nullable fields over ambiguous optional data handling.

## Migration workflow

When schema changes:

1. Update `src/server/db/schema.ts`.
2. Run `bun run db:generate`.
   - If this fails with `ENOENT ... migrations/meta/_journal.json`, the `meta/` directory is missing. Run `mkdir -p src/server/db/migrations/meta` and re-run `db:generate`. **Do not hand-author `_journal.json`** — let drizzle-kit create it with the correct format.
   - After generation, run `bun run format` immediately so Biome normalizes the generated `meta/*.json` files (otherwise `bun run check` will fail on formatting).
3. Run `bun run db:migrate`.
   - This requires `DATABASE_URL` to be set in the environment. If the environment does not have `DATABASE_URL` (e.g. local dev without a DB), `db:migrate` will fail. This is expected — the generated SQL is still correct and will be applied when deployed. **Do not mark the migration step as done if the command exited with an error.** Instead, note in the handoff: "Migration SQL generated; `db:migrate` pending until `DATABASE_URL` is available."
4. Run project validation (`bun run check`, `bun run format`, `bun run check`, `bun run build`, `bun run test` when logic changed).

## Data safety

- Avoid destructive migrations unless explicitly required.
- Preserve backwards compatibility for existing records when possible.
- Do not store secrets or tokens in plain text unless explicitly required and documented.

## Code usage

- Access DB through `getDb()` (`@/lib/db`) from server-side code only.
- Keep large query-building logic out of route components; put it in server procedures/services.
