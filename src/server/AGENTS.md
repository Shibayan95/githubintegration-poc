# Server (AppGen)

Server-only logic lives here: auth, cookies, platform HTTP helpers, tRPC server handlers, and DB-backed integrations.

## Boundaries

- Keep server modules server-only. Do not import from `src/server/**` in client components/routes.
- Never expose secrets, auth tokens, or raw cookie values to the client.
- Read env values from `@/env` only on the server.

## Auth and cookies

- App auth cookie key is `APP_AUTH_COOKIE_NAME` from `@/server/authCookie`.
- Set/delete auth cookies only through `setAppAuthCookie` and `deleteAppAuthCookie`.
- Keep auth checks centralized (`protectedProcedure` and route auth guard), not duplicated in each feature.

## Platform requests

- Use `platformRequest` via `apiFetch` or `enterpriseApiFetch` in `src/server/platform/`.
- Let shared helpers set common headers (`Workspace-Id`, auth header). Do not duplicate this logic.
- Map platform/API failures to safe, user-friendly errors (no leaked stack traces or internal URLs).

## S3 file storage (`src/server/s3/client.ts`)

Server-only wrapper around the **AWS SDK v3** (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`). We use the AWS SDK, not `Bun.s3`, because the dev server runs under **Node.js** (Vite) and only production runs under **Bun** — Bun's built-in S3 throws `Cannot find module 'bun'` / `Bun is not defined` under Node. The AWS SDK works in both. Reads `S3_*` env vars (validated in `src/env/server.ts`). App code passes **relative** keys — `S3_PREFIX` (e.g. `apps/{app_id}/`) is prepended transparently. The client is cached and re-keyed by a fingerprint of `(access_key, session_token)` so credential rotation invalidates the cache automatically.

### Credentials are STS temporary

The platform injects an STS triple (`S3_ACCESS_KEY` + `S3_SECRET_KEY` + `AWS_SESSION_TOKEN`) plus `S3_REGION`, `S3_BUCKET`, `S3_PREFIX`, `S3_TOKEN_LIFETIME` (seconds — default 43200 = 12h). Refresh policy is **belt + braces**:

| Trigger | What happens |
|---|---|
| Operation past 85% of `S3_TOKEN_LIFETIME` | Proactive refresh before the call runs (e.g. ~10h12m on a 12h token, adapts to any lifetime) |
| `ExpiredToken` mid-operation | `uploadFile` / `deleteFile` refresh and retry once |
| Dev sandbox creds rotated by `SandboxEnvInjector` | Client cache invalidated on next call via fingerprint |
| Local dev (no `AIS_API_BASE_URL` + `APPGEN_APP_ID`) | Refresh is a no-op, helpers work the same |

Refresh endpoint (authenticates as the signed-in user via the `ais-auth-cookie`,
which is `SameSite=None` in the deployed iframe so it reaches server functions):
```
GET ${AIS_API_BASE_URL}/enterprise/api/v1/agentic_coding/apps/${APPGEN_APP_ID}/settings/storage/refresh_credentials
Headers: Workspace-Id, Authorization: Bearer <user token from ais-auth-cookie>
```
Response: `{ data: { s3_access_key, s3_secret_key, aws_session_token, s3_bucket, s3_prefix, s3_region } }`

Because refresh needs the user's request cookie, it only works **inside an
authenticated request** — which is where S3 ops run in an auth-gated app.

### Usage

Dynamic-import inside server function handlers — **never** at module top level:

```tsx
import { createServerFn } from "@tanstack/react-start";

// File uploads must use FormData (createServerFn can't JSON-serialize a File).
export const uploadAvatar = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data }) => {
    const file = data.get("file") as File;
    const userId = data.get("userId") as string;
    const { uploadFile } = await import("@/server/s3/client");
    const key = `uploads/avatars/${userId}.jpg`;
    await uploadFile(key, file, { contentType: file.type });
    return { key }; // store the RELATIVE key in the DB
  });

export const getAvatarUrl = createServerFn({ method: "GET" })
  .inputValidator((key: string) => key)
  .handler(async ({ data: key }) => {
    const { getPresignedUrl } = await import("@/server/s3/client");
    return { url: await getPresignedUrl(key, { expiresIn: 3600 }) };
  });
```

Frontend sends `FormData`, not JSON:
```tsx
const fd = new FormData();
fd.append("file", file);
fd.append("userId", userId);
await uploadAvatar({ data: fd });
```

### API

All helpers are async. Keys are relative (`uploads/photo.jpg`); `S3_PREFIX` is prepended.

| Helper | Use |
|---|---|
| `uploadFile(key, data, { contentType? })` | Upload string / Uint8Array / ArrayBuffer / Blob (File). Proactive + reactive refresh. |
| `downloadFile(key)` | Returns `Uint8Array`, or `null` if the object doesn't exist. Proactive + reactive refresh. |
| `deleteFile(key)` | Delete one object. Proactive + reactive refresh. |
| `getPresignedUrl(key, { expiresIn?, method? })` | Time-limited URL. `method: "GET"` (default) for downloads, `"PUT"` for direct browser uploads. Default 1h. |
| `refreshS3Credentials()` | Force-refresh. Returns `false` if no refresh URL is configured (local dev) or the call failed. |

### Safety rules

- Store **relative keys** in the DB (`uploads/photo.jpg`), never the full S3 path or presigned URL.
- Helpers are server-only — `S3_SECRET_KEY` and `AWS_SESSION_TOKEN` never leave the server.
- Use presigned URLs for client downloads > 1MB; server proxy is fine for small public assets.
- **Public folders** (`assets/`): direct S3 URL, no auth.
- **Private folders** (`uploads/`, `exports/`): presigned URL with 1h default expiry.

### Files you DON'T touch

`src/server/s3/client.ts`, `src/env/server.ts`, `.env.local`, `.env.example` (enforced by `opencode.json`).

## Maintainability expectations

- No hardcoded tenant-specific IDs/names in server feature logic.
- Keep business transformations in small helpers (parse/map/validate), not inside long procedures.
- Validate external payloads before write paths when practical.
